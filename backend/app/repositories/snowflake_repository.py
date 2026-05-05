import os
from typing import List, Dict, Tuple, Optional
import snowflake.connector
from snowflake.connector.cursor import SnowflakeCursor
import re
from app.repositories.base import BaseRepository
from app.models.dashboard import VapsAttachRate, RecommendationEntry
from app.core.config import settings
from openpyxl import load_workbook

class SnowflakeRepository(BaseRepository):
    def __init__(self):
        self.recommendations = self._load_recommendations()

    def _get_connection(self):
        return snowflake.connector.connect(
            user=settings.SNOWFLAKE_USER,
            password=settings.SNOWFLAKE_PASSWORD,
            account=settings.SNOWFLAKE_ACCOUNT,
            warehouse=settings.SNOWFLAKE_WAREHOUSE,
            database=settings.SNOWFLAKE_DATABASE,
            schema=settings.SNOWFLAKE_SCHEMA,
            role=settings.SNOWFLAKE_ROLE
        )

    # Reusing recommendation loading logic since this is from a static file for now
    def _text(self, val) -> str:
        return str(val or "").strip()

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
        path = os.path.join(settings.DATA_PATH, "actual_recomendationsheet.xlsx")
        if not os.path.exists(path):
            return {}
        
        wb = load_workbook(path, data_only=True)
        ws = wb.active
        entries = {}

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

    def _execute_query(self, query: str, segment_key: Optional[str] = None, segment_col: Optional[str] = None) -> List[VapsAttachRate]:
        rows = []
        with self._get_connection() as conn:
            with conn.cursor(snowflake.connector.DictCursor) as cur:
                cur.execute(query)
                for row in cur:
                    vaps_code = self._text(row.get("vaps_code") or row.get("VAPS_CODE"))
                    unit_code = self._text(row.get("unit_code") or row.get("UNIT_CODE"))
                    if not vaps_code or not unit_code:
                        continue

                    rec = self.recommendations.get((unit_code, vaps_code))

                    segment_val = ""
                    if segment_col:
                        segment_val = self._text(row.get(segment_col) or row.get(segment_col.upper()))

                    attach_rate_val = row.get("Vaps_Attach_Rate") or row.get("VAPS_ATTACH_RATE")
                    attach_rate = float(attach_rate_val) / 100.0 if attach_rate_val is not None else 0.0

                    rows.append(VapsAttachRate(
                        unit=unit_code,
                        vaps=vaps_code,
                        vapsDesc=self._text(row.get("VAPS_DESCRIPTION")),
                        activations=int(row.get("Unit_Activations") or row.get("UNIT_ACTIVATIONS") or 0),
                        associated=int(row.get("Vaps_Associated_With_Unit") or row.get("VAPS_ASSOCIATED_WITH_UNIT") or 0),
                        attachRate=attach_rate,
                        unitName=self._text(row.get("UNIT_PRODUCTNAME_SF")),
                        unitDescription=self._text(row.get("UNIT_DESCRIPTION")),
                        unitL2=self._text(row.get("UNIT_L2_CORE_SOLUTION")),
                        unitL3=self._text(row.get("UNIT_L3_PRODUCTS")),
                        mainGroup=self._text(row.get("VAPS_MAIN_GROUP")) or "Unmapped",
                        detailedGroup=self._text(row.get("VAPS_DETAILED_GROUP")) or "Unmapped",
                        tier=self._text(row.get("VAPS_PACKAGE_TIER")) or "Unmapped",
                        source=self._text(row.get("VAPS_SOURCE")) or "Unmapped",
                        coveredByRecommendationLogic=rec.coveredByRecommendationLogic if rec else False,
                        market=segment_val if segment_key == "market" else "",
                        division=segment_val if segment_key == "division" else "",
                        region=segment_val if segment_key == "region" else ""
                    ))
        return rows

    def get_unit_attach_rates(self) -> List[VapsAttachRate]:
        query = "SELECT * FROM gs_unit_vaps_attach_rate"
        return self._execute_query(query)

    def get_market_attach_rates(self) -> List[VapsAttachRate]:
        query = "SELECT * FROM gs_unit_market_segment_vaps_attach_rate"
        return self._execute_query(query, "market", "MARKET_SEGMENT_DESCRIPTION")

    def get_division_attach_rates(self) -> List[VapsAttachRate]:
        query = "SELECT * FROM gs_unit_division_vaps_attach_rate"
        return self._execute_query(query, "division", "DIVISION")

    def get_region_attach_rates(self) -> List[VapsAttachRate]:
        query = "SELECT * FROM gs_unit_region_vaps_attach_rate"
        return self._execute_query(query, "region", "REGION")

    def get_recommendation_entries(self) -> Dict[Tuple[str, str], RecommendationEntry]:
        return self.recommendations
