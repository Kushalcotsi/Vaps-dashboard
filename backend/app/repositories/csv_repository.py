import pandas as pd
import os
import re
from typing import List, Dict, Tuple, Optional
from app.repositories.base import BaseRepository
from app.models.dashboard import VapsAttachRate, RecommendationEntry
from app.core.config import settings
from openpyxl import load_workbook

class CSVRepository(BaseRepository):
    def __init__(self):
        self.data_dir = settings.DATA_PATH
        self.recommendations = self._load_recommendations()

    def _text(self, val) -> str:
        if pd.isna(val):
            return ""
        return str(val or "").strip()

    def _number(self, val) -> float:
        if pd.isna(val):
            return 0.0
        try:
            return float(str(val or "").replace(",", ""))
        except ValueError:
            return 0.0

    def _parse_vaps_header(self, value: object) -> Tuple[str, str]:
        header = " ".join(str(value or "").replace("\r", "\n").split())
        match = re.match(r"^(.*?)\s*\(([^()]*)\)\s*$", header)
        if not match:
            return header, ""
        return match.group(1).strip(), match.group(2).strip()

    def _recommendation_kind(self, value: object) -> str:
        value_text = self._text(value)
        lowered = value_text.lower()
        if not value_text or value_text == "0" or lowered in {"not applicable", "n/a"}:
            return "Not covered"
        if re.fullmatch(r"\d+(\.\d+)?", value_text):
            return "Fixed quantity"
        if value_text.startswith("# based on"):
            return "Quantity rule"
        if lowered.startswith("if ") or " if " in lowered:
            return "Conditional rule"
        if lowered.startswith("same as"):
            return "Dependency rule"
        return "Rule"

    def _load_recommendations(self) -> Dict[Tuple[str, str], RecommendationEntry]:
        path = os.path.join(self.data_dir, "actual_recomendationsheet.xlsx")
        if not os.path.exists(path):
            return {}
        
        wb = load_workbook(path, data_only=True)
        ws = wb.active
        entries = {}

        # Logic adapted from references/generate_analytical_dashboard.py
        header_row = None
        unit_col = None
        for row in ws.iter_rows():
            for cell in row:
                if self._text(cell.value) == "Unit - Product Code (SF)":
                    header_row = cell.row
                    unit_col = cell.column
                    break
            if header_row is not None:
                break
        
        if header_row is None:
            return {}

        vaps_columns = []
        for cell in ws[header_row]:
            vaps_desc, vaps_code = self._parse_vaps_header(cell.value)
            if cell.column >= 27 and re.fullmatch(r"[A-Z0-9]+", vaps_code):
                vaps_columns.append((cell.column, vaps_code, vaps_desc, len(vaps_columns)))

        for row_index in range(header_row + 1, ws.max_row + 1):
            unit_code = self._text(ws.cell(row_index, unit_col).value)
            if not unit_code:
                continue
            
            for column, vaps_code, vaps_desc, sequence in vaps_columns:
                val = ws.cell(row_index, column).value
                val_text = self._text(val)
                covered = val_text.lower() not in {"not applicable", "n/a"} and val_text != "0" and bool(val_text)
                
                entries[(unit_code, vaps_code)] = RecommendationEntry(
                    unit=unit_code,
                    vaps=vaps_code,
                    vapsDesc=vaps_desc,
                    recommendationValue=val_text,
                    coveredByRecommendationLogic=covered,
                    recommendationKind=self._recommendation_kind(val),
                    sequence=sequence
                )
        return entries

    def _load_csv_rows(self, filename: str, segment_column: Optional[str] = None, segment_key: Optional[str] = None) -> List[VapsAttachRate]:
        path = os.path.join(self.data_dir, filename)
        if not os.path.exists(path):
            return []
        
        df = pd.read_csv(path)
        rows = []
        for _, source_row in df.iterrows():
            vaps_code = self._text(source_row.get("vaps_code"))
            unit_code = self._text(source_row.get("unit_code"))
            if not vaps_code or not unit_code:
                continue
            
            rec = self.recommendations.get((unit_code, vaps_code))
            
            rows.append(VapsAttachRate(
                unit=unit_code,
                vaps=vaps_code,
                vapsDesc=self._text(source_row.get("VAPS_DESCRIPTION")),
                activations=int(self._number(source_row.get("Unit_Activations"))),
                associated=int(self._number(source_row.get("Vaps_Associated_With_Unit"))),
                attachRate=self._number(source_row.get("Vaps_Attach_Rate")) / 100,
                unitName=self._text(source_row.get("UNIT_PRODUCTNAME_SF")),
                unitDescription=self._text(source_row.get("UNIT_DESCRIPTION")),
                unitL2=self._text(source_row.get("UNIT_L2_CORE_SOLUTION")),
                unitL3=self._text(source_row.get("UNIT_L3_PRODUCTS")),
                mainGroup=self._text(source_row.get("VAPS_MAIN_GROUP")) or "Unmapped",
                detailedGroup=self._text(source_row.get("VAPS_DETAILED_GROUP")) or "Unmapped",
                tier=self._text(source_row.get("VAPS_PACKAGE_TIER")) or "Unmapped",
                source=self._text(source_row.get("VAPS_SOURCE")) or "Unmapped",
                coveredByRecommendationLogic=rec.coveredByRecommendationLogic if rec else False,
                market=self._text(source_row.get(segment_column)) if segment_key == "market" else "",
                division=self._text(source_row.get("division")) if segment_key == "region" else (self._text(source_row.get(segment_column)) if segment_key == "division" else ""),
                region=self._text(source_row.get(segment_column)) if segment_key == "region" else ""
            ))
        return rows

    def get_unit_attach_rates(self) -> List[VapsAttachRate]:
        return self._load_csv_rows("unit_segment_vaps_attach_rate.csv")

    def get_market_attach_rates(self) -> List[VapsAttachRate]:
        return self._load_csv_rows("unit_market_segment_vaps_attach_rate.csv", "MARKET_SEGMENT_DESCRIPTION", "market")

    def get_division_attach_rates(self) -> List[VapsAttachRate]:
        return self._load_csv_rows("attach_rate_unit_division.csv", "division", "division")

    def get_region_attach_rates(self) -> List[VapsAttachRate]:
        return self._load_csv_rows("attach_rate_unit_region.csv", "region", "region")

    def get_recommendation_entries(self) -> Dict[Tuple[str, str], RecommendationEntry]:
        return self.recommendations
