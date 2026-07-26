#!/usr/bin/env python
# pip install pandas numpy plotly jinja2

from __future__ import annotations

import argparse
import html
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.io as pio
from jinja2 import Environment


class DataValidationError(Exception):
    """Raised when the input data does not meet the expected schema."""


@dataclass(frozen=True)
class SchemaConfig:
    product_group_columns: list[str]
    display_product_column: str
    market_column: str
    time_grain: str
    time_columns: list[str]


ALIASES: dict[str, list[str]] = {
    "year": ["year", "fiscal_year"],
    "quarter": ["quarter", "qtr", "fiscal_quarter"],
    "month": ["month", "month_num", "month_number", "month_name", "calendar_month"],
    "period": ["period", "period_date", "date", "reporting_period", "time_period"],
    "unit_code": ["unit_code", "product_code", "sku", "item_code", "unit_sku"],
    "product_name": [
        "product_name",
        "unit_productname_sf",
        "product",
        "item_name",
        "unit_description",
        "unit_detaileddescription",
    ],
    "market_segment": [
        "market_segment",
        "market_segment_description",
        "segment",
        "market",
        "market_name",
    ],
    "unit_market_activations": [
        "unit_market_activations",
        "product_market_activations",
        "product_segment_activations",
    ],
    "unit_activations": ["unit_activations", "product_activations", "total_unit_activations"],
    "market_activations": ["market_activations", "segment_activations", "total_market_activations"],
    "market_contribution_to_product": [
        "market_contribution_to_product",
        "contribution_to_product",
        "market_contribution",
    ],
    "product_share_in_market": [
        "product_share_in_market",
        "share_in_market",
        "market_share",
    ],
}

REQUIRED_ACTIVATION_COLUMNS = [
    "unit_market_activations",
    "unit_activations",
    "market_activations",
]

INVALID_MARKET_VALUES = {"", "nan", "none", "unknown"}
UNCLASSIFIED_MARKET = "Unclassified"

MIN_LATEST_ACTIVATIONS = 5
MIN_TOTAL_HISTORICAL_ACTIVATIONS = 15
MIN_PERIODS_OBSERVED = 3

LABEL_COLOR_MAP = {
    "Core Recommendation": "#0f766e",
    "Emerging Opportunity": "#2563eb",
    "White Space Opportunity": "#ea580c",
    "Declining Product": "#dc2626",
    "High Dependency Risk": "#7c3aed",
    "Insufficient Data": "#64748b",
    "Low Priority": "#94a3b8",
}

CONFIDENCE_COLOR_MAP = {
    "High": "#0f766e",
    "Medium": "#2563eb",
    "Low": "#dc2626",
}


def print_progress(message: str) -> None:
    print(f"[INFO] {message}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build decision-safe recommendation outputs and an HTML report from activation history.",
    )
    parser.add_argument("--input", required=True, help="Path to the input CSV file.")
    parser.add_argument("--output-dir", required=True, help="Directory where outputs will be written.")
    return parser.parse_args()


def standardize_column_name(column_name: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9]+", "_", column_name.strip().lower())
    normalized = re.sub(r"_+", "_", normalized).strip("_")
    return normalized


def deduplicate_names(columns: list[str]) -> list[str]:
    seen: dict[str, int] = {}
    deduped: list[str] = []
    for column in columns:
        count = seen.get(column, 0)
        if count == 0:
            deduped.append(column)
        else:
            deduped.append(f"{column}_{count + 1}")
        seen[column] = count + 1
    return deduped


def first_present(columns: list[str], candidates: list[str]) -> str | None:
    for candidate in candidates:
        if candidate in columns:
            return candidate
    return None


def clean_and_standardize_columns(df: pd.DataFrame) -> pd.DataFrame:
    standardized_columns = deduplicate_names([standardize_column_name(column) for column in df.columns])
    df = df.copy()
    df.columns = standardized_columns

    rename_map: dict[str, str] = {}
    for canonical_name, aliases in ALIASES.items():
        matched_column = first_present(list(df.columns), aliases)
        if matched_column and canonical_name not in df.columns:
            rename_map[matched_column] = canonical_name
    if rename_map:
        df = df.rename(columns=rename_map)
    return df


def ensure_required_columns(df: pd.DataFrame, columns: list[str], context: str) -> None:
    missing = [column for column in columns if column not in df.columns]
    if missing:
        raise DataValidationError(f"Missing required {context} columns: {', '.join(missing)}")


def clean_numeric_column(series: pd.Series) -> pd.Series:
    numeric = pd.to_numeric(series, errors="coerce").fillna(0.0)
    return numeric.clip(lower=0.0)


def parse_month_value(value: Any) -> float:
    if pd.isna(value):
        return np.nan
    text = str(value).strip()
    if not text:
        return np.nan
    numeric = pd.to_numeric(pd.Series([text]), errors="coerce").iloc[0]
    if pd.notna(numeric):
        return float(numeric)
    month_key = text[:3].lower()
    month_lookup = {
        "jan": 1,
        "feb": 2,
        "mar": 3,
        "apr": 4,
        "may": 5,
        "jun": 6,
        "jul": 7,
        "aug": 8,
        "sep": 9,
        "oct": 10,
        "nov": 11,
        "dec": 12,
    }
    return float(month_lookup.get(month_key, np.nan))


def parse_quarter_series(series: pd.Series) -> pd.Series:
    text = series.astype(str).str.extract(r"([1-4])", expand=False)
    return pd.to_numeric(text, errors="coerce")


def build_time_dimension(df: pd.DataFrame) -> tuple[pd.DataFrame, str, list[str]]:
    df = df.copy()
    columns = list(df.columns)

    if "period" in columns and df["period"].notna().any():
        period_start = pd.to_datetime(df["period"], errors="coerce")
        if period_start.isna().all():
            raise DataValidationError("The period column exists, but none of its values could be parsed as dates.")
        df["period_start"] = period_start.dt.to_period("M").dt.to_timestamp()
        df["period_label"] = df["period_start"].dt.strftime("%Y-%m")
        return df, "period", ["period"]

    if "year" not in columns:
        raise DataValidationError("A year or period column is required to build the time dimension.")

    df["year"] = pd.to_numeric(df["year"], errors="coerce")
    if df["year"].isna().any():
        raise DataValidationError("The year column contains non-numeric values that cannot be parsed.")
    df["year"] = df["year"].astype(int)

    if "month" in columns and df["month"].notna().any():
        df["month"] = df["month"].apply(parse_month_value)
        if df["month"].isna().any():
            raise DataValidationError("The month column contains values that could not be parsed.")
        df["month"] = df["month"].astype(int)
        df["period_start"] = pd.to_datetime(
            {"year": df["year"], "month": df["month"], "day": 1},
            errors="coerce",
        )
        df["period_label"] = df["period_start"].dt.strftime("%Y-%m")
        return df, "month", ["year", "month"]

    if "quarter" in columns and df["quarter"].notna().any():
        df["quarter"] = parse_quarter_series(df["quarter"])
        if df["quarter"].isna().any():
            raise DataValidationError("The quarter column contains values that could not be parsed.")
        df["quarter"] = df["quarter"].astype(int)
        quarter_start_month = (df["quarter"] - 1) * 3 + 1
        df["period_start"] = pd.to_datetime(
            {"year": df["year"], "month": quarter_start_month, "day": 1},
            errors="coerce",
        )
        df["period_label"] = df["year"].astype(str) + "-Q" + df["quarter"].astype(str)
        return df, "quarter", ["year", "quarter"]

    df["period_start"] = pd.to_datetime({"year": df["year"], "month": 1, "day": 1}, errors="coerce")
    df["period_label"] = df["year"].astype(str)
    return df, "year", ["year"]


def first_non_null(series: pd.Series) -> Any:
    non_null = series.dropna()
    if non_null.empty:
        return np.nan
    return non_null.iloc[0]


def aggregate_if_needed(
    df: pd.DataFrame,
    product_group_columns: list[str],
    market_column: str,
    time_columns: list[str],
) -> pd.DataFrame:
    group_columns = product_group_columns + [market_column, "period_start", "period_label", *time_columns]
    duplicate_rows = int(df.duplicated(subset=group_columns).sum())
    if duplicate_rows == 0:
        return df

    print_progress(
        f"Found {duplicate_rows:,} duplicate product-market-period rows. Aggregating activation counts before scoring."
    )

    aggregation_map: dict[str, str | Callable[[pd.Series], Any]] = {
        column: "sum" for column in REQUIRED_ACTIVATION_COLUMNS
    }
    for column in df.columns:
        if column in group_columns or column in REQUIRED_ACTIVATION_COLUMNS:
            continue
        if column == "market_segment_was_invalid":
            aggregation_map[column] = "max"
        else:
            aggregation_map[column] = first_non_null

    aggregated = (
        df.groupby(group_columns, dropna=False, as_index=False)
        .agg(aggregation_map)
        .sort_values(product_group_columns + [market_column, "period_start"])
        .reset_index(drop=True)
    )
    return aggregated


def safe_ratio(numerator: pd.Series, denominator: pd.Series) -> pd.Series:
    numerator_values = pd.to_numeric(numerator, errors="coerce").fillna(0.0).to_numpy(dtype=float)
    denominator_values = pd.to_numeric(denominator, errors="coerce").fillna(0.0).to_numpy(dtype=float)
    result = np.divide(
        numerator_values,
        denominator_values,
        out=np.zeros(len(numerator_values), dtype=float),
        where=denominator_values > 0,
    )
    return pd.Series(result, index=numerator.index)


def safe_ratio_scalar(numerator: float, denominator: float) -> float:
    numerator_value = float(numerator)
    denominator_value = float(denominator)
    if denominator_value <= 0:
        return 0.0
    return numerator_value / denominator_value


def safe_growth(current: pd.Series, previous: pd.Series) -> pd.Series:
    current_values = pd.to_numeric(current, errors="coerce").fillna(0.0).to_numpy(dtype=float)
    previous_values = pd.to_numeric(previous, errors="coerce").fillna(0.0).to_numpy(dtype=float)
    result = np.zeros(len(current_values), dtype=float)

    positive_previous = previous_values > 0
    result[positive_previous] = (current_values[positive_previous] / previous_values[positive_previous]) - 1

    no_previous = ~positive_previous
    result[no_previous] = np.where(current_values[no_previous] > 0, 1.0, 0.0)
    return pd.Series(result, index=current.index)


def safe_momentum(recent_avg: pd.Series, previous_avg: pd.Series) -> pd.Series:
    recent_values = pd.to_numeric(recent_avg, errors="coerce").fillna(0.0).to_numpy(dtype=float)
    previous_values = pd.to_numeric(previous_avg, errors="coerce").fillna(0.0).to_numpy(dtype=float)
    result = np.ones(len(recent_values), dtype=float)

    positive_previous = previous_values > 0
    result[positive_previous] = recent_values[positive_previous] / previous_values[positive_previous]

    zero_previous = ~positive_previous
    result[zero_previous] = np.where(recent_values[zero_previous] > 0, 2.0, 1.0)
    return pd.Series(result, index=recent_avg.index)


def min_max_scale(series: pd.Series) -> pd.Series:
    numeric = pd.to_numeric(series, errors="coerce")
    valid = numeric.dropna()
    if valid.empty:
        return pd.Series(0.0, index=series.index)
    min_value = valid.min()
    max_value = valid.max()
    if np.isclose(min_value, max_value):
        return pd.Series(0.5, index=series.index)
    scaled = (numeric - min_value) / (max_value - min_value)
    return scaled.fillna(0.0).clip(0.0, 1.0)


def format_int(value: Any) -> str:
    if pd.isna(value):
        return "0"
    return f"{int(round(float(value))):,}"


def format_float(value: Any, decimals: int = 3) -> str:
    if pd.isna(value):
        return "0"
    return f"{float(value):.{decimals}f}"


def format_pct(value: Any) -> str:
    if pd.isna(value):
        return "0.0%"
    return f"{float(value) * 100:.1f}%"


def shorten_text(value: Any, max_length: int = 42) -> str:
    text = str(value or "").strip()
    if len(text) <= max_length:
        return text
    return text[: max_length - 3].rstrip() + "..."


def product_display_label(row: pd.Series, schema: SchemaConfig) -> str:
    product_text = str(row.get(schema.display_product_column, "") or "").strip()
    unit_code = str(row.get("unit_code", "") or "").strip()
    if product_text and unit_code and unit_code not in product_text:
        return f"{product_text} ({unit_code})"
    return product_text or unit_code or "Unknown Product"


def normalize_market_segment(series: pd.Series) -> tuple[pd.Series, pd.Series]:
    raw = series.copy()
    invalid_mask = raw.isna()
    cleaned = raw.fillna("").astype(str).str.strip()
    invalid_mask = invalid_mask | cleaned.str.lower().isin(INVALID_MARKET_VALUES)
    cleaned = cleaned.mask(invalid_mask, UNCLASSIFIED_MARKET)
    return cleaned, invalid_mask


def prepare_schema(df: pd.DataFrame) -> tuple[pd.DataFrame, SchemaConfig]:
    print_progress("Cleaning and standardizing column names")
    df = clean_and_standardize_columns(df)

    ensure_required_columns(df, REQUIRED_ACTIVATION_COLUMNS, "activation")

    market_column = "market_segment" if "market_segment" in df.columns else None
    if market_column is None:
        raise DataValidationError("A market segment column is required.")

    product_group_columns = [column for column in ["unit_code", "product_name"] if column in df.columns]
    if not product_group_columns:
        raise DataValidationError("At least one product identifier column is required, such as unit_code or product_name.")

    display_product_column = "product_name" if "product_name" in df.columns else product_group_columns[0]

    for column in REQUIRED_ACTIVATION_COLUMNS:
        df[column] = clean_numeric_column(df[column])

    df[market_column], invalid_market_mask = normalize_market_segment(df[market_column])
    df["market_segment_was_invalid"] = invalid_market_mask.astype(int)

    df, time_grain, time_columns = build_time_dimension(df)
    df = aggregate_if_needed(df, product_group_columns, market_column, time_columns)

    schema = SchemaConfig(
        product_group_columns=product_group_columns,
        display_product_column=display_product_column,
        market_column=market_column,
        time_grain=time_grain,
        time_columns=time_columns,
    )
    return df, schema


def calculate_time_aware_features(df: pd.DataFrame, schema: SchemaConfig) -> pd.DataFrame:
    print_progress("Calculating historical features")
    df = df.copy()
    group_columns = schema.product_group_columns + [schema.market_column]
    df = df.sort_values(group_columns + ["period_start"]).reset_index(drop=True)

    df["product_share_in_market"] = safe_ratio(df["unit_market_activations"], df["market_activations"])
    df["market_contribution_to_product"] = safe_ratio(df["unit_market_activations"], df["unit_activations"])

    grouped = df.groupby(group_columns, dropna=False, sort=False)

    df["previous_period_activations"] = grouped["unit_market_activations"].shift(1).fillna(0.0)
    df["previous_product_share_in_market"] = grouped["product_share_in_market"].shift(1).fillna(0.0)
    df["previous_market_contribution_to_product"] = grouped["market_contribution_to_product"].shift(1).fillna(0.0)

    df["activation_growth_rate"] = safe_growth(
        df["unit_market_activations"],
        df["previous_period_activations"],
    ).clip(-1.0, 5.0)
    df["product_share_change"] = df["product_share_in_market"] - df["previous_product_share_in_market"]
    df["market_contribution_change"] = (
        df["market_contribution_to_product"] - df["previous_market_contribution_to_product"]
    )

    df["rolling_4_period_activations"] = grouped["unit_market_activations"].transform(
        lambda series: series.rolling(window=4, min_periods=1).sum()
    )
    df["rolling_4_period_product_share"] = grouped["product_share_in_market"].transform(
        lambda series: series.rolling(window=4, min_periods=1).mean()
    )
    df["rolling_4_period_market_contribution"] = grouped["market_contribution_to_product"].transform(
        lambda series: series.rolling(window=4, min_periods=1).mean()
    )
    df["recent_2_period_avg_activations"] = grouped["unit_market_activations"].transform(
        lambda series: series.rolling(window=2, min_periods=1).mean()
    )
    df["previous_2_period_avg_activations"] = grouped["unit_market_activations"].transform(
        lambda series: series.shift(2).rolling(window=2, min_periods=1).mean()
    ).fillna(0.0)
    df["momentum_score"] = safe_momentum(
        df["recent_2_period_avg_activations"],
        df["previous_2_period_avg_activations"],
    ).clip(0.0, 5.0)

    previous_4_period_activations = grouped["unit_market_activations"].transform(
        lambda series: series.rolling(window=4, min_periods=1).sum().shift(4)
    ).fillna(0.0)
    df["recent_growth"] = safe_growth(
        df["recent_2_period_avg_activations"],
        df["previous_2_period_avg_activations"],
    ).clip(-1.0, 5.0)
    df["longer_term_growth"] = safe_growth(
        df["rolling_4_period_activations"],
        previous_4_period_activations,
    ).clip(-1.0, 5.0)
    df["trend_score"] = (
        0.6 * df["recent_growth"] + 0.4 * df["longer_term_growth"].fillna(df["recent_growth"])
    ).clip(-1.0, 5.0)

    df["periods_observed_total"] = grouped["period_start"].transform("nunique").astype(int)
    df["total_historical_unit_market_activations"] = grouped["unit_market_activations"].transform("sum")
    df["total_historical_unit_activations"] = grouped["unit_activations"].transform("sum")
    df["total_historical_market_activations"] = grouped["market_activations"].transform("sum")

    global_latest_period = df["period_start"].max()
    df["global_latest_period"] = global_latest_period
    df["is_global_latest_period"] = df["period_start"].eq(global_latest_period)
    return df


def build_latest_recommendations(df: pd.DataFrame, schema: SchemaConfig) -> pd.DataFrame:
    print_progress("Building global-latest recommendation frame")
    latest_df = df.loc[df["is_global_latest_period"]].copy()
    if latest_df.empty:
        raise DataValidationError("No rows were found in the global latest period.")

    latest_df["latest_unit_market_activations"] = latest_df["unit_market_activations"]
    latest_df["latest_unit_activations"] = latest_df["unit_activations"]
    latest_df["latest_market_activations"] = latest_df["market_activations"]
    latest_df["latest_product_share_in_market"] = latest_df["product_share_in_market"]
    latest_df["latest_market_contribution_to_product"] = latest_df["market_contribution_to_product"]
    latest_df["historical_product_share_in_market"] = safe_ratio(
        latest_df["total_historical_unit_market_activations"],
        latest_df["total_historical_market_activations"],
    )
    latest_df["historical_market_contribution_to_product"] = safe_ratio(
        latest_df["total_historical_unit_market_activations"],
        latest_df["total_historical_unit_activations"],
    )
    latest_df["blended_product_share_in_market"] = (
        0.65 * latest_df["latest_product_share_in_market"]
        + 0.35 * latest_df["historical_product_share_in_market"]
    )
    latest_df["blended_market_contribution_to_product"] = (
        0.65 * latest_df["latest_market_contribution_to_product"]
        + 0.35 * latest_df["historical_market_contribution_to_product"]
    )

    latest_df["latest_activations"] = latest_df["latest_unit_market_activations"]
    latest_df["historical_activations"] = latest_df["total_historical_unit_market_activations"]
    latest_df["periods_observed"] = latest_df["periods_observed_total"]

    latest_df["support_sufficient"] = (
        (latest_df["latest_activations"] >= MIN_LATEST_ACTIVATIONS)
        & (latest_df["historical_activations"] >= MIN_TOTAL_HISTORICAL_ACTIVATIONS)
        & (latest_df["periods_observed"] >= MIN_PERIODS_OBSERVED)
    )
    latest_df["low_support_pair"] = ~latest_df["support_sufficient"]

    latest_df.loc[latest_df["low_support_pair"], "momentum_score"] = latest_df.loc[
        latest_df["low_support_pair"],
        "momentum_score",
    ].clip(upper=1.10)
    latest_df.loc[latest_df["low_support_pair"], "trend_score"] = latest_df.loc[
        latest_df["low_support_pair"],
        "trend_score",
    ].clip(upper=0.10)

    latest_df["normalized_latest_activations"] = min_max_scale(latest_df["latest_activations"])
    latest_df["normalized_total_activations"] = min_max_scale(latest_df["historical_activations"])
    latest_df["normalized_periods_observed"] = min_max_scale(latest_df["periods_observed"])
    latest_df["normalized_market_activations"] = min_max_scale(latest_df["latest_market_activations"])
    latest_df["support_score"] = (
        0.35 * latest_df["normalized_latest_activations"]
        + 0.35 * latest_df["normalized_total_activations"]
        + 0.20 * latest_df["normalized_periods_observed"]
        + 0.10 * latest_df["normalized_market_activations"]
    ).clip(0.0, 1.0)

    latest_df["confidence_level"] = np.select(
        [
            latest_df["support_score"] >= 0.70,
            latest_df["support_score"] >= 0.35,
        ],
        ["High", "Medium"],
        default="Low",
    )
    latest_df.loc[latest_df["low_support_pair"], "confidence_level"] = "Low"

    latest_df["normalized_blended_product_share_in_market"] = min_max_scale(
        latest_df["blended_product_share_in_market"]
    )
    latest_df["normalized_blended_market_contribution_to_product"] = min_max_scale(
        latest_df["blended_market_contribution_to_product"]
    )
    latest_df["normalized_momentum_score"] = min_max_scale(latest_df["momentum_score"])
    latest_df["normalized_trend_score"] = min_max_scale(latest_df["trend_score"])
    latest_df["recommendation_score"] = (
        0.30 * latest_df["normalized_blended_product_share_in_market"]
        + 0.20 * latest_df["normalized_blended_market_contribution_to_product"]
        + 0.20 * latest_df["normalized_momentum_score"]
        + 0.15 * latest_df["normalized_trend_score"]
        + 0.15 * latest_df["support_score"]
    ).clip(0.0, 1.0)

    latest_df = assign_recommendation_labels(latest_df, schema)
    latest_df["include_in_primary_recommendations"] = (
        latest_df[schema.market_column].ne(UNCLASSIFIED_MARKET)
        & latest_df["confidence_level"].isin(["High", "Medium"])
        & latest_df["is_global_latest_period"]
    )
    latest_df["review_reason"] = latest_df.apply(build_review_reason, axis=1, schema=schema)

    latest_df = latest_df.sort_values(
        [schema.market_column, "recommendation_score", "latest_activations"],
        ascending=[True, False, False],
    ).reset_index(drop=True)
    return latest_df


def assign_recommendation_labels(df: pd.DataFrame, schema: SchemaConfig) -> pd.DataFrame:
    df = df.copy()
    classified_df = df.loc[df[schema.market_column] != UNCLASSIFIED_MARKET].copy()
    if classified_df.empty:
        raise DataValidationError("All market segments were unclassified after cleaning.")

    market_share_stats = (
        classified_df.groupby(schema.market_column, dropna=False)["blended_product_share_in_market"]
        .agg(
            market_share_p25=lambda series: series.quantile(0.25),
            market_share_median="median",
            market_share_p75=lambda series: series.quantile(0.75),
        )
        .reset_index()
    )
    product_contribution_stats = (
        classified_df.groupby(schema.product_group_columns, dropna=False)["blended_market_contribution_to_product"]
        .quantile(0.80)
        .rename("product_contribution_p80")
        .reset_index()
    )
    global_market_activation_p75 = float(classified_df["latest_market_activations"].quantile(0.75))

    df = df.merge(market_share_stats, on=schema.market_column, how="left")
    df = df.merge(product_contribution_stats, on=schema.product_group_columns, how="left")

    labels: list[str] = []
    for _, row in df.iterrows():
        share = float(row["blended_product_share_in_market"])
        contribution = float(row["blended_market_contribution_to_product"])
        momentum = float(row["momentum_score"])
        trend = float(row["trend_score"])
        latest_activations = float(row["latest_activations"])
        periods_observed = float(row["periods_observed"])
        market_activations = float(row["latest_market_activations"])
        confidence = str(row["confidence_level"])
        market_share_p25 = float(row.get("market_share_p25", 0.0) or 0.0)
        market_share_median = float(row.get("market_share_median", 0.0) or 0.0)
        market_share_p75 = float(row.get("market_share_p75", 0.0) or 0.0)
        product_contribution_p80 = float(row.get("product_contribution_p80", 0.0) or 0.0)

        if latest_activations < 3 or periods_observed < 2:
            labels.append("Insufficient Data")
            continue
        if (
            share >= market_share_p75
            and momentum >= 0.90
            and trend >= -0.05
            and confidence in {"Medium", "High"}
        ):
            labels.append("Core Recommendation")
            continue
        if (
            share >= market_share_p25
            and share <= market_share_p75
            and momentum >= 1.15
            and trend > 0
            and confidence in {"Medium", "High"}
        ):
            labels.append("Emerging Opportunity")
            continue
        if (
            share <= market_share_p25
            and market_activations >= global_market_activation_p75
            and momentum >= 1.10
            and trend > 0
            and latest_activations >= 5
            and confidence != "Low"
        ):
            labels.append("White Space Opportunity")
            continue
        if (momentum < 0.85 or trend < -0.10) and latest_activations >= 5:
            labels.append("Declining Product")
            continue
        if (
            contribution >= product_contribution_p80
            and share <= market_share_median
            and latest_activations >= 5
        ):
            labels.append("High Dependency Risk")
            continue
        labels.append("Low Priority")

    df["recommendation_label"] = labels
    return df


def build_review_reason(row: pd.Series, schema: SchemaConfig) -> str:
    reasons: list[str] = []
    if str(row.get(schema.market_column, "")) == UNCLASSIFIED_MARKET:
        reasons.append("Unclassified market segment")
    if float(row.get("latest_activations", 0.0)) < 3 or float(row.get("periods_observed", 0.0)) < 2:
        reasons.append("Insufficient current observation history")
    elif not bool(row.get("support_sufficient", False)):
        reasons.append("Below minimum support thresholds")
    if str(row.get("confidence_level", "")) == "Low":
        reasons.append("Low confidence")
    if not reasons:
        reasons.append("No review flag")
    return "; ".join(reasons)


def build_primary_recommendations(latest_df: pd.DataFrame, schema: SchemaConfig) -> pd.DataFrame:
    primary_df = latest_df.loc[latest_df["include_in_primary_recommendations"]].copy()
    return primary_df.reset_index(drop=True)


def build_market_level_recommendations(primary_df: pd.DataFrame, schema: SchemaConfig) -> pd.DataFrame:
    market_df = (
        primary_df.sort_values([schema.market_column, "recommendation_score"], ascending=[True, False])
        .groupby(schema.market_column, dropna=False, group_keys=False)
        .head(5)
        .reset_index(drop=True)
    )
    market_df["market_rank"] = market_df.groupby(schema.market_column, dropna=False).cumcount() + 1
    return market_df


def build_high_confidence_recommendations(primary_df: pd.DataFrame) -> pd.DataFrame:
    return primary_df.sort_values(
        ["recommendation_score", "latest_activations"],
        ascending=[False, False],
    ).reset_index(drop=True)


def build_low_confidence_review_items(latest_df: pd.DataFrame, schema: SchemaConfig) -> pd.DataFrame:
    review_df = latest_df.loc[
        (latest_df["confidence_level"] == "Low")
        | (latest_df["recommendation_label"] == "Insufficient Data")
        | latest_df[schema.market_column].eq(UNCLASSIFIED_MARKET)
    ].copy()
    review_df = review_df.sort_values(
        ["confidence_level", "recommendation_score", "latest_activations"],
        ascending=[True, False, False],
    ).reset_index(drop=True)
    return review_df


def build_table_records(df: pd.DataFrame, schema: SchemaConfig) -> list[dict[str, str]]:
    records: list[dict[str, str]] = []
    for _, row in df.iterrows():
        records.append(
            {
                "product": product_display_label(row, schema),
                "market_segment": str(row.get(schema.market_column, "")),
                "period": str(row.get("period_label", "")),
                "latest_activations": format_int(row.get("latest_activations")),
                "historical_activations": format_int(row.get("historical_activations")),
                "periods_observed": format_int(row.get("periods_observed")),
                "latest_market_activations": format_int(row.get("latest_market_activations")),
                "latest_product_share": format_pct(row.get("latest_product_share_in_market")),
                "historical_product_share": format_pct(row.get("historical_product_share_in_market")),
                "blended_product_share": format_pct(row.get("blended_product_share_in_market")),
                "latest_market_contribution": format_pct(row.get("latest_market_contribution_to_product")),
                "historical_market_contribution": format_pct(row.get("historical_market_contribution_to_product")),
                "blended_market_contribution": format_pct(row.get("blended_market_contribution_to_product")),
                "momentum_score": format_float(row.get("momentum_score"), 2),
                "trend_score": format_float(row.get("trend_score"), 2),
                "support_score": format_float(row.get("support_score"), 3),
                "confidence_level": str(row.get("confidence_level", "")),
                "recommendation_score": format_float(row.get("recommendation_score"), 3),
                "recommendation_label": str(row.get("recommendation_label", "")),
                "review_reason": str(row.get("review_reason", "")),
            }
        )
    return records


def build_market_sections(df: pd.DataFrame, schema: SchemaConfig) -> list[dict[str, Any]]:
    sections: list[dict[str, Any]] = []
    for market_segment, market_frame in df.groupby(schema.market_column, dropna=False):
        sections.append(
            {
                "market_segment": str(market_segment),
                "rows": build_table_records(
                    market_frame.sort_values("recommendation_score", ascending=False).head(10),
                    schema,
                ),
            }
        )
    return sections


def market_heat_class(label: str, confidence: str) -> str:
    if label == "Core Recommendation":
        return "heat-core"
    if label in {"Emerging Opportunity", "White Space Opportunity"}:
        return "heat-growth"
    if label == "High Dependency Risk":
        return "heat-risk"
    if label == "Declining Product":
        return "heat-decline"
    if confidence == "Low":
        return "heat-low"
    return "heat-mid"


def build_market_heatmap_html(df: pd.DataFrame, schema: SchemaConfig) -> str:
    if df.empty:
        return '<p class="empty-state">No high-confidence market recommendations are available.</p>'

    heat_df = df.copy()
    if "unit_code" in heat_df.columns:
        heat_df["heatmap_unit"] = heat_df["unit_code"].fillna("").astype(str).str.strip()
    else:
        heat_df["heatmap_unit"] = ""
    heat_df["heatmap_unit"] = heat_df["heatmap_unit"].replace("", np.nan)
    heat_df["heatmap_unit"] = heat_df["heatmap_unit"].fillna(
        heat_df.apply(lambda row: product_display_label(row, schema), axis=1)
    )

    market_order = (
        heat_df.groupby(schema.market_column, dropna=False)["recommendation_score"]
        .max()
        .sort_values(ascending=False)
        .index.tolist()
    )
    unit_order = (
        heat_df.groupby("heatmap_unit", dropna=False)["recommendation_score"]
        .max()
        .sort_values(ascending=False)
        .index.tolist()
    )

    header_cells = ['<th class="market-sticky-head">Market Segment</th>']
    header_cells.extend(
        f'<th class="market-head" title="{html.escape(str(unit))}">{html.escape(shorten_text(unit, 20))}</th>'
        for unit in unit_order
    )

    body_rows: list[str] = []
    for market_segment in market_order:
        market_rows = heat_df.loc[heat_df[schema.market_column] == market_segment]
        row_cells = [
            f'<td class="market-sticky-cell"><strong>{html.escape(str(market_segment))}</strong></td>'
        ]
        for unit in unit_order:
            match = market_rows.loc[market_rows["heatmap_unit"] == unit]
            if match.empty:
                row_cells.append('<td class="heat-cell heat-empty"><span>No primary recommendation</span></td>')
                continue
            row = match.iloc[0]
            tooltip = "\n".join(
                [
                    f"Market Segment: {market_segment}",
                    f"Unit: {unit}",
                    f"Product: {product_display_label(row, schema)}",
                    f"Confidence: {row.get('confidence_level', '')}",
                    f"Latest Activations: {format_int(row.get('latest_activations'))}",
                    f"Historical Activations: {format_int(row.get('historical_activations'))}",
                    f"Periods Observed: {format_int(row.get('periods_observed'))}",
                    f"Latest Product Share: {format_pct(row.get('latest_product_share_in_market'))}",
                    f"Historical Product Share: {format_pct(row.get('historical_product_share_in_market'))}",
                    f"Blended Product Share: {format_pct(row.get('blended_product_share_in_market'))}",
                    f"Latest Market Contribution: {format_pct(row.get('latest_market_contribution_to_product'))}",
                    f"Historical Market Contribution: {format_pct(row.get('historical_market_contribution_to_product'))}",
                    f"Blended Market Contribution: {format_pct(row.get('blended_market_contribution_to_product'))}",
                    f"Momentum: {format_float(row.get('momentum_score'), 2)}",
                    f"Trend: {format_float(row.get('trend_score'), 2)}",
                    f"Support Score: {format_float(row.get('support_score'), 3)}",
                    f"Recommendation Score: {format_float(row.get('recommendation_score'), 3)}",
                    f"Label: {row.get('recommendation_label', '')}",
                ]
            )
            row_cells.append(
                "".join(
                    [
                        f'<td class="heat-cell {market_heat_class(str(row.get("recommendation_label", "")), str(row.get("confidence_level", "")))}" title="{html.escape(tooltip)}">',
                        f"<strong>{format_pct(row.get('recommendation_score'))}</strong>",
                        f"<span>{html.escape(shorten_text(product_display_label(row, schema), 28))}</span>",
                        f"<small>{html.escape(str(row.get('confidence_level', '')))} | {html.escape(str(row.get('recommendation_label', '')))}</small>",
                        "</td>",
                    ]
                )
            )
        body_rows.append("<tr>" + "".join(row_cells) + "</tr>")

    return "".join(
        [
            '<table class="heatmap-table">',
            "<thead><tr>",
            "".join(header_cells),
            "</tr></thead>",
            "<tbody>",
            "".join(body_rows),
            "</tbody></table>",
        ]
    )


def create_plotly_charts(
    latest_df: pd.DataFrame,
    high_confidence_df: pd.DataFrame,
    low_confidence_df: pd.DataFrame,
    schema: SchemaConfig,
) -> dict[str, str]:
    print_progress("Building report charts")
    chart_frames: list[tuple[str, Any]] = []

    latest_chart_df = latest_df.copy()
    latest_chart_df["product_display"] = latest_chart_df.apply(lambda row: product_display_label(row, schema), axis=1)
    latest_chart_df["product_display_short"] = latest_chart_df["product_display"].map(
        lambda value: shorten_text(value, 32)
    )
    latest_chart_df["market_segment_short"] = latest_chart_df[schema.market_column].map(
        lambda value: shorten_text(value, 24)
    )

    fig_score_conf = px.scatter(
        latest_chart_df,
        x="recommendation_score",
        y="support_score",
        color="confidence_level",
        color_discrete_map=CONFIDENCE_COLOR_MAP,
        size="latest_activations",
        size_max=24,
        hover_data={
            "product_display": True,
            schema.market_column: True,
            "recommendation_label": True,
            "latest_activations": ":,.0f",
            "historical_activations": ":,.0f",
            "periods_observed": ":,.0f",
            "support_score": ":.3f",
            "recommendation_score": ":.3f",
        },
        title="Recommendation Score vs Confidence Support",
    )
    fig_score_conf.update_xaxes(title="Recommendation Score", tickformat=".0%")
    fig_score_conf.update_yaxes(title="Support Score", tickformat=".0%")
    chart_frames.append(("score_vs_confidence", fig_score_conf))

    low_label_counts = (
        low_confidence_df["recommendation_label"].value_counts().rename_axis("recommendation_label").reset_index(name="count")
    )
    fig_low_conf = px.bar(
        low_label_counts.sort_values("count"),
        x="count",
        y="recommendation_label",
        orientation="h",
        color="recommendation_label",
        color_discrete_map=LABEL_COLOR_MAP,
        text="count",
        title="Low-Confidence Review Items by Label",
    )
    fig_low_conf.update_traces(textposition="outside", cliponaxis=False)
    fig_low_conf.update_xaxes(title="Latest Product-Market Pairs")
    fig_low_conf.update_yaxes(title="")
    chart_frames.append(("low_confidence_by_label", fig_low_conf))

    comparison_df = latest_chart_df.nlargest(150, "recommendation_score").copy()
    fig_latest_vs_hist = px.scatter(
        comparison_df,
        x="historical_product_share_in_market",
        y="latest_product_share_in_market",
        color="confidence_level",
        color_discrete_map=CONFIDENCE_COLOR_MAP,
        size="latest_activations",
        size_max=24,
        hover_data={
            "product_display": True,
            schema.market_column: True,
            "blended_product_share_in_market": ":.3f",
            "recommendation_label": True,
        },
        title="Latest vs Historical Product Share",
    )
    fig_latest_vs_hist.update_xaxes(title="Historical Product Share", tickformat=".0%")
    fig_latest_vs_hist.update_yaxes(title="Latest Product Share", tickformat=".0%")
    chart_frames.append(("latest_vs_historical_share", fig_latest_vs_hist))

    top_primary = high_confidence_df.head(20).copy()
    top_primary["product_market"] = (
        top_primary.apply(lambda row: product_display_label(row, schema), axis=1).map(lambda value: shorten_text(value, 28))
        + " | "
        + top_primary[schema.market_column].map(lambda value: shorten_text(value, 22))
    )
    fig_top_primary = px.bar(
        top_primary.sort_values("recommendation_score"),
        x="recommendation_score",
        y="product_market",
        orientation="h",
        color="recommendation_label",
        color_discrete_map=LABEL_COLOR_MAP,
        text="confidence_level",
        hover_data={
            "recommendation_score": ":.3f",
            "support_score": ":.3f",
            "latest_activations": ":,.0f",
            "historical_activations": ":,.0f",
            "periods_observed": ":,.0f",
            "product_market": False,
        },
        title="Top High/Medium Confidence Recommendations",
    )
    fig_top_primary.update_traces(textposition="outside", cliponaxis=False)
    fig_top_primary.update_xaxes(title="Recommendation Score", tickformat=".0%")
    fig_top_primary.update_yaxes(title="")
    chart_frames.append(("top_high_confidence", fig_top_primary))

    chart_html: dict[str, str] = {}
    for index, (name, figure) in enumerate(chart_frames):
        figure.update_layout(
            template="plotly_white",
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="#ffffff",
            margin=dict(l=24, r=24, t=64, b=24),
            font=dict(family="Segoe UI, Arial, sans-serif", size=12, color="#1d2a33"),
            showlegend=True,
            legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="left", x=0),
        )
        figure.update_xaxes(showgrid=True, gridcolor="#e7e1d6", zeroline=False)
        figure.update_yaxes(showgrid=True, gridcolor="#e7e1d6", zeroline=False)
        chart_html[name] = pio.to_html(
            figure,
            full_html=False,
            include_plotlyjs="cdn" if index == 0 else False,
            config={"displayModeBar": False, "responsive": True},
        )
    return chart_html


def build_summary(
    transformed_df: pd.DataFrame,
    latest_df: pd.DataFrame,
    high_confidence_df: pd.DataFrame,
    schema: SchemaConfig,
) -> dict[str, Any]:
    latest_global_period = transformed_df["global_latest_period"].iloc[0]
    latest_global_label_candidates = (
        transformed_df.loc[transformed_df["period_start"] == latest_global_period, "period_label"].dropna().astype(str)
    )
    latest_global_label = latest_global_label_candidates.iloc[0] if not latest_global_label_candidates.empty else "Unknown"

    label_counts = latest_df["recommendation_label"].value_counts().to_dict()
    return {
        "total_products": int(latest_df[schema.product_group_columns].drop_duplicates().shape[0]),
        "total_market_segments": int(
            latest_df.loc[latest_df[schema.market_column] != UNCLASSIFIED_MARKET, schema.market_column]
            .dropna()
            .nunique()
        ),
        "total_latest_pairs": int(
            latest_df[schema.product_group_columns + [schema.market_column]].drop_duplicates().shape[0]
        ),
        "high_medium_confidence_pairs": int(high_confidence_df.shape[0]),
        "latest_time_period": latest_global_label,
        "average_recommendation_score": float(latest_df["recommendation_score"].mean()),
        "label_counts": label_counts,
    }


def build_data_quality_summary(
    transformed_df: pd.DataFrame,
    latest_df: pd.DataFrame,
    high_confidence_df: pd.DataFrame,
    schema: SchemaConfig,
) -> dict[str, Any]:
    unclassified_latest = latest_df[schema.market_column].eq(UNCLASSIFIED_MARKET).sum()
    return {
        "missing_market_segment_count": int(transformed_df["market_segment_was_invalid"].sum()),
        "low_support_recommendation_count": int(latest_df["low_support_pair"].sum()),
        "excluded_from_primary_count": int(latest_df.shape[0] - high_confidence_df.shape[0]),
        "unclassified_latest_pair_count": int(unclassified_latest),
    }


def run_validations(
    transformed_df: pd.DataFrame,
    latest_df: pd.DataFrame,
    high_confidence_df: pd.DataFrame,
    market_level_df: pd.DataFrame,
    schema: SchemaConfig,
) -> list[dict[str, str]]:
    checks: list[tuple[str, bool, str]] = []

    all_market_values = transformed_df[schema.market_column].fillna("").astype(str).str.strip().str.lower()
    checks.append(
        (
            "No invalid market segment placeholders appear in the cleaned data",
            not all_market_values.isin({"nan", "none", "unknown", ""}).any(),
            "Market segments are normalized to Unclassified before scoring.",
        )
    )
    checks.append(
        (
            "Primary recommendations only use the global latest period",
            bool(high_confidence_df["is_global_latest_period"].all()) and bool(market_level_df["is_global_latest_period"].all() if not market_level_df.empty else True),
            "Primary outputs are filtered from the single global latest period only.",
        )
    )
    checks.append(
        (
            "No Core Recommendation has Low confidence",
            latest_df.loc[latest_df["recommendation_label"] == "Core Recommendation", "confidence_level"].eq("Low").sum() == 0,
            "Core recommendations require Medium or High confidence.",
        )
    )
    checks.append(
        (
            "No White Space Opportunity has latest activations below 5",
            latest_df.loc[latest_df["recommendation_label"] == "White Space Opportunity", "latest_activations"].lt(5).sum() == 0,
            "White space labels enforce a minimum latest activation threshold.",
        )
    )
    score_columns = [
        "support_score",
        "normalized_blended_product_share_in_market",
        "normalized_blended_market_contribution_to_product",
        "normalized_momentum_score",
        "normalized_trend_score",
        "recommendation_score",
    ]
    scores_in_range = True
    for column in score_columns:
        valid = latest_df[column].between(0.0, 1.0, inclusive="both").all()
        scores_in_range = scores_in_range and bool(valid)
    checks.append(
        (
            "All normalized scores are between 0 and 1",
            scores_in_range,
            "Scoring columns are clipped into a bounded decision scale.",
        )
    )
    ratio_columns = [
        "latest_product_share_in_market",
        "historical_product_share_in_market",
        "blended_product_share_in_market",
        "latest_market_contribution_to_product",
        "historical_market_contribution_to_product",
        "blended_market_contribution_to_product",
        "momentum_score",
        "trend_score",
    ]
    finite_ok = True
    for column in ratio_columns:
        values = pd.to_numeric(latest_df[column], errors="coerce").to_numpy(dtype=float)
        finite_ok = finite_ok and bool(np.isfinite(values).all())
    checks.append(
        (
            "No division-by-zero or infinite values are present",
            finite_ok,
            "Safe ratio and safe growth guards are applied throughout the pipeline.",
        )
    )

    results: list[dict[str, str]] = []
    failed_checks: list[str] = []
    for name, passed, detail in checks:
        results.append(
            {
                "name": name,
                "status": "PASS" if passed else "FAIL",
                "detail": detail,
            }
        )
        if not passed:
            failed_checks.append(name)

    if failed_checks:
        raise DataValidationError("Validation checks failed: " + "; ".join(failed_checks))
    return results


def export_dataframe(df: pd.DataFrame, output_path: Path) -> None:
    df.to_csv(output_path, index=False)
    print_progress(f"Wrote {output_path.name}")


def render_html_report(
    transformed_df: pd.DataFrame,
    latest_df: pd.DataFrame,
    high_confidence_df: pd.DataFrame,
    low_confidence_df: pd.DataFrame,
    market_level_df: pd.DataFrame,
    schema: SchemaConfig,
    validation_results: list[dict[str, str]],
    output_path: Path,
) -> None:
    print_progress("Rendering HTML report")
    summary = build_summary(transformed_df, latest_df, high_confidence_df, schema)
    data_quality = build_data_quality_summary(transformed_df, latest_df, high_confidence_df, schema)
    charts = create_plotly_charts(latest_df, high_confidence_df, low_confidence_df, schema)

    comparison_df = high_confidence_df.head(25).copy()
    unclassified_df = latest_df.loc[latest_df[schema.market_column] == UNCLASSIFIED_MARKET].copy()

    env = Environment(autoescape=True)
    template = env.from_string(REPORT_TEMPLATE)
    rendered = template.render(
        generated_on=pd.Timestamp.now().strftime("%Y-%m-%d %H:%M"),
        summary=summary,
        data_quality=data_quality,
        validation_results=validation_results,
        label_counts=[
            {"label": label, "count": count}
            for label, count in sorted(summary["label_counts"].items(), key=lambda item: (-item[1], item[0]))
        ],
        market_heatmap_html=build_market_heatmap_html(market_level_df, schema),
        market_sections=build_market_sections(market_level_df, schema),
        comparison_rows=build_table_records(comparison_df, schema),
        high_confidence_rows=build_table_records(high_confidence_df.head(50), schema),
        low_confidence_rows=build_table_records(low_confidence_df.head(50), schema),
        unclassified_rows=build_table_records(unclassified_df.head(50), schema),
        charts=charts,
        avg_score=format_float(summary["average_recommendation_score"], 3),
    )
    output_path.write_text(rendered, encoding="utf-8")
    print_progress(f"Wrote {output_path.name}")


REPORT_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recommendation Report</title>
  <style>
    :root {
      --bg: #f5f1ea;
      --panel: #fffdf8;
      --ink: #1d2a33;
      --muted: #5e6d77;
      --line: #d8cfc0;
      --brand: #0f766e;
      --brand-soft: #d7f3ef;
      --accent: #c2410c;
      --shadow: 0 18px 40px rgba(29, 42, 51, 0.08);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      background:
        radial-gradient(circle at top left, rgba(15, 118, 110, 0.08), transparent 35%),
        linear-gradient(180deg, #fbf8f2 0%, var(--bg) 100%);
      color: var(--ink);
    }

    .page {
      width: min(1780px, calc(100% - 24px));
      margin: 0 auto;
      padding: 20px 0 40px;
    }

    .hero {
      background: linear-gradient(135deg, rgba(15, 118, 110, 0.95), rgba(22, 78, 99, 0.92));
      color: #ffffff;
      padding: 36px;
      border-radius: 24px;
      box-shadow: var(--shadow);
      margin-bottom: 28px;
    }

    .hero h1 {
      margin: 0 0 12px;
      font-size: 2.2rem;
      letter-spacing: -0.03em;
    }

    .hero p {
      margin: 0;
      color: rgba(255, 255, 255, 0.9);
      max-width: 980px;
      line-height: 1.6;
    }

    .grid { display: grid; gap: 18px; }

    .summary-grid {
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      margin-bottom: 28px;
    }

    .card {
      background: var(--panel);
      border: 1px solid rgba(216, 207, 192, 0.8);
      border-radius: 20px;
      box-shadow: var(--shadow);
      padding: 22px;
      margin-bottom: 24px;
    }

    .metric-label {
      color: var(--muted);
      font-size: 0.92rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 10px;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.03em;
    }

    h2 {
      margin: 0 0 14px;
      font-size: 1.45rem;
      letter-spacing: -0.02em;
    }

    h3 {
      margin: 0 0 10px;
      font-size: 1.12rem;
    }

    p.section-copy {
      color: var(--muted);
      line-height: 1.6;
      margin-top: 0;
      margin-bottom: 16px;
    }

    .bullet-list {
      margin: 0;
      padding-left: 18px;
      color: var(--ink);
      line-height: 1.6;
    }

    .label-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      padding: 0;
      list-style: none;
      margin: 0;
    }

    .label-pills li {
      background: var(--brand-soft);
      color: var(--brand);
      padding: 10px 14px;
      border-radius: 999px;
      font-weight: 600;
    }

    .table-wrap {
      overflow-x: auto;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: #ffffff;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 1320px;
    }

    th, td {
      padding: 12px 14px;
      border-bottom: 1px solid #ece5d9;
      text-align: left;
      vertical-align: top;
      font-size: 0.92rem;
    }

    th {
      background: #f8f4ec;
      color: var(--muted);
      position: sticky;
      top: 0;
      z-index: 1;
    }

    tbody tr:hover {
      background: #fcfaf6;
    }

    .tabs {
      margin-top: 12px;
    }

    .tab-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 16px;
    }

    .tab-button {
      border: 1px solid var(--line);
      background: #f6f1e8;
      color: var(--muted);
      padding: 10px 16px;
      border-radius: 999px;
      font-weight: 600;
      cursor: pointer;
    }

    .tab-button.active {
      background: var(--brand);
      color: #ffffff;
      border-color: var(--brand);
    }

    .tab-panel { display: none; }
    .tab-panel.active { display: block; }

    .heatmap-wrap {
      overflow: auto;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: #ffffff;
      max-height: 760px;
    }

    .heatmap-table {
      width: max-content;
      min-width: 100%;
      border-collapse: collapse;
      background: #ffffff;
    }

    .heatmap-table th,
    .heatmap-table td {
      border-bottom: 1px solid #ece5d9;
      border-right: 1px solid #ece5d9;
      padding: 10px 12px;
      font-size: 0.9rem;
      line-height: 1.25;
      vertical-align: top;
    }

    .heatmap-table th {
      position: sticky;
      top: 0;
      z-index: 2;
      background: #f8f4ec;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .market-sticky-head,
    .market-sticky-cell {
      position: sticky;
      left: 0;
      z-index: 3;
      min-width: 260px;
      max-width: 260px;
      background: #fffdf8;
    }

    .market-sticky-head {
      z-index: 4;
      background: #f8f4ec;
      text-align: left;
    }

    .market-head {
      width: 180px;
      min-width: 180px;
      max-width: 180px;
      text-align: center;
    }

    .heat-cell {
      width: 180px;
      min-width: 180px;
      max-width: 180px;
      text-align: left;
      font-weight: 700;
    }

    .heat-cell strong,
    .heat-cell span,
    .heat-cell small { display: block; }
    .heat-cell span { margin-top: 4px; font-size: 0.82rem; font-weight: 600; }
    .heat-cell small { margin-top: 4px; font-size: 0.72rem; font-weight: 700; color: #45525b; }

    .heat-core { background: #b8e0d7; }
    .heat-growth { background: #d8e8ff; }
    .heat-risk { background: #eadcff; }
    .heat-decline { background: #f8d7d4; }
    .heat-mid { background: #eef4f8; }
    .heat-low { background: #f7f3eb; }
    .heat-empty { background: #f8fafb; color: #7b8791; }

    .charts {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
      align-items: start;
    }

    .chart-card {
      background: #ffffff;
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 16px 16px 8px;
      overflow: hidden;
    }

    .chart-card p {
      color: var(--muted);
      font-size: 0.92rem;
      line-height: 1.5;
      margin: 0 0 10px;
    }

    .chart-frame { min-height: 360px; }
    .chart-frame > div { width: 100%; }

    .validation-pass { color: #0f766e; font-weight: 700; }
    .validation-fail { color: #dc2626; font-weight: 700; }
    .empty-state { color: var(--muted); font-style: italic; margin: 0; }

    @media (max-width: 1100px) {
      .charts { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="page">
    <section class="hero">
      <h1>Decision-Safe Product-Market Recommendation Report</h1>
      <p>
        This report anchors recommendations to one global latest period, then uses historical behavior only to
        stabilize momentum, trend, and blended share signals. Low-volume spikes are separated into review items so the
        primary recommendation sections remain decision-safe. Generated on {{ generated_on }}.
      </p>
    </section>

    <section class="grid summary-grid">
      <div class="card">
        <div class="metric-label">Latest Period</div>
        <div class="metric-value">{{ summary.latest_time_period }}</div>
      </div>
      <div class="card">
        <div class="metric-label">Latest Pairs</div>
        <div class="metric-value">{{ "{:,}".format(summary.total_latest_pairs) }}</div>
      </div>
      <div class="card">
        <div class="metric-label">Products</div>
        <div class="metric-value">{{ "{:,}".format(summary.total_products) }}</div>
      </div>
      <div class="card">
        <div class="metric-label">Primary Pairs</div>
        <div class="metric-value">{{ "{:,}".format(summary.high_medium_confidence_pairs) }}</div>
      </div>
      <div class="card">
        <div class="metric-label">Average Score</div>
        <div class="metric-value">{{ avg_score }}</div>
      </div>
    </section>

    <section class="card">
      <h2>Data Quality Summary</h2>
      <p class="section-copy">
        Unclassified or low-support combinations are still surfaced, but they are kept out of primary recommendation sections by default.
      </p>
      <ul class="label-pills">
        <li>Missing market segment rows: {{ "{:,}".format(data_quality.missing_market_segment_count) }}</li>
        <li>Low-support latest pairs: {{ "{:,}".format(data_quality.low_support_recommendation_count) }}</li>
        <li>Excluded from primary: {{ "{:,}".format(data_quality.excluded_from_primary_count) }}</li>
        <li>Unclassified latest pairs: {{ "{:,}".format(data_quality.unclassified_latest_pair_count) }}</li>
      </ul>
    </section>

    <section class="card">
      <h2>Model Logic Summary</h2>
      <ul class="bullet-list">
        <li>The latest period is the only period used for current recommendation rows.</li>
        <li>Historical rows are used only to calculate lag, rolling, momentum, trend, and blended baselines.</li>
        <li>Blended share and contribution weight current behavior at 65% and history at 35%.</li>
        <li>Confidence uses latest volume, historical volume, periods observed, and market size.</li>
        <li>Low-support combinations are capped and treated as review items rather than strong recommendations.</li>
      </ul>
    </section>

    <section class="card">
      <h2>Recommendation Labels</h2>
      <ul class="label-pills">
        {% for item in label_counts %}
        <li>{{ item.label }}: {{ "{:,}".format(item.count) }}</li>
        {% endfor %}
      </ul>
    </section>

    <section class="card">
      <h2>Primary Market Recommendations</h2>
      <p class="section-copy">
        These sections only show High or Medium confidence product-market pairs from the global latest period and exclude Unclassified segments.
      </p>
      <div class="tabs" data-tabs>
        <div class="tab-buttons">
          <button class="tab-button active" type="button" data-tab-button="market-heatmap">Heat Map</button>
          <button class="tab-button" type="button" data-tab-button="market-table">Table View</button>
        </div>

        <div class="tab-panel active" data-tab-panel="market-heatmap">
          <div class="heatmap-wrap">
            {{ market_heatmap_html | safe }}
          </div>
        </div>

        <div class="tab-panel" data-tab-panel="market-table">
          {% for section in market_sections %}
          <h3>{{ section.market_segment }}</h3>
          <div class="table-wrap" style="margin-bottom: 18px;">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Period</th>
                  <th>Confidence</th>
                  <th>Latest Activations</th>
                  <th>Historical Activations</th>
                  <th>Periods Observed</th>
                  <th>Latest Share</th>
                  <th>Historical Share</th>
                  <th>Blended Share</th>
                  <th>Momentum</th>
                  <th>Trend</th>
                  <th>Score</th>
                  <th>Label</th>
                </tr>
              </thead>
              <tbody>
                {% for row in section.rows %}
                <tr>
                  <td>{{ row.product }}</td>
                  <td>{{ row.period }}</td>
                  <td>{{ row.confidence_level }}</td>
                  <td>{{ row.latest_activations }}</td>
                  <td>{{ row.historical_activations }}</td>
                  <td>{{ row.periods_observed }}</td>
                  <td>{{ row.latest_product_share }}</td>
                  <td>{{ row.historical_product_share }}</td>
                  <td>{{ row.blended_product_share }}</td>
                  <td>{{ row.momentum_score }}</td>
                  <td>{{ row.trend_score }}</td>
                  <td>{{ row.recommendation_score }}</td>
                  <td>{{ row.recommendation_label }}</td>
                </tr>
                {% endfor %}
              </tbody>
            </table>
          </div>
          {% endfor %}
        </div>
      </div>
    </section>

    <section class="card">
      <h2>Latest vs Historical Comparison</h2>
      <p class="section-copy">
        Top recommendations are shown with both current-period and historical attach metrics so decision-makers can see whether the score is coming from durable behavior or a short-term move.
      </p>
      {% if comparison_rows %}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Market Segment</th>
              <th>Confidence</th>
              <th>Latest Activations</th>
              <th>Historical Activations</th>
              <th>Periods Observed</th>
              <th>Latest Share</th>
              <th>Historical Share</th>
              <th>Blended Share</th>
              <th>Latest Contribution</th>
              <th>Historical Contribution</th>
              <th>Blended Contribution</th>
              <th>Momentum</th>
              <th>Trend</th>
              <th>Score</th>
              <th>Label</th>
            </tr>
          </thead>
          <tbody>
            {% for row in comparison_rows %}
            <tr>
              <td>{{ row.product }}</td>
              <td>{{ row.market_segment }}</td>
              <td>{{ row.confidence_level }}</td>
              <td>{{ row.latest_activations }}</td>
              <td>{{ row.historical_activations }}</td>
              <td>{{ row.periods_observed }}</td>
              <td>{{ row.latest_product_share }}</td>
              <td>{{ row.historical_product_share }}</td>
              <td>{{ row.blended_product_share }}</td>
              <td>{{ row.latest_market_contribution }}</td>
              <td>{{ row.historical_market_contribution }}</td>
              <td>{{ row.blended_market_contribution }}</td>
              <td>{{ row.momentum_score }}</td>
              <td>{{ row.trend_score }}</td>
              <td>{{ row.recommendation_score }}</td>
              <td>{{ row.recommendation_label }}</td>
            </tr>
            {% endfor %}
          </tbody>
        </table>
      </div>
      {% else %}
      <p class="empty-state">No top recommendations were available for comparison.</p>
      {% endif %}
    </section>

    <section class="card">
      <h2>Low-Confidence Review Items</h2>
      <p class="section-copy">
        These rows are intentionally separated from primary recommendations. They need business review before any action because support is thin, confidence is low, or the market segment is unclassified.
      </p>
      {% if low_confidence_rows %}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Market Segment</th>
              <th>Confidence</th>
              <th>Latest Activations</th>
              <th>Historical Activations</th>
              <th>Periods Observed</th>
              <th>Latest Share</th>
              <th>Historical Share</th>
              <th>Blended Share</th>
              <th>Momentum</th>
              <th>Trend</th>
              <th>Score</th>
              <th>Label</th>
              <th>Review Reason</th>
            </tr>
          </thead>
          <tbody>
            {% for row in low_confidence_rows %}
            <tr>
              <td>{{ row.product }}</td>
              <td>{{ row.market_segment }}</td>
              <td>{{ row.confidence_level }}</td>
              <td>{{ row.latest_activations }}</td>
              <td>{{ row.historical_activations }}</td>
              <td>{{ row.periods_observed }}</td>
              <td>{{ row.latest_product_share }}</td>
              <td>{{ row.historical_product_share }}</td>
              <td>{{ row.blended_product_share }}</td>
              <td>{{ row.momentum_score }}</td>
              <td>{{ row.trend_score }}</td>
              <td>{{ row.recommendation_score }}</td>
              <td>{{ row.recommendation_label }}</td>
              <td>{{ row.review_reason }}</td>
            </tr>
            {% endfor %}
          </tbody>
        </table>
      </div>
      {% else %}
      <p class="empty-state">No low-confidence review items were generated.</p>
      {% endif %}
    </section>

    <section class="card">
      <h2>Data Quality / Unclassified Records</h2>
      <p class="section-copy">
        These records were mapped to Unclassified because the source market segment was blank, missing, or matched a placeholder value.
      </p>
      {% if unclassified_rows %}
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Market Segment</th>
              <th>Confidence</th>
              <th>Latest Activations</th>
              <th>Historical Activations</th>
              <th>Periods Observed</th>
              <th>Latest Share</th>
              <th>Historical Share</th>
              <th>Blended Share</th>
              <th>Score</th>
              <th>Label</th>
              <th>Review Reason</th>
            </tr>
          </thead>
          <tbody>
            {% for row in unclassified_rows %}
            <tr>
              <td>{{ row.product }}</td>
              <td>{{ row.market_segment }}</td>
              <td>{{ row.confidence_level }}</td>
              <td>{{ row.latest_activations }}</td>
              <td>{{ row.historical_activations }}</td>
              <td>{{ row.periods_observed }}</td>
              <td>{{ row.latest_product_share }}</td>
              <td>{{ row.historical_product_share }}</td>
              <td>{{ row.blended_product_share }}</td>
              <td>{{ row.recommendation_score }}</td>
              <td>{{ row.recommendation_label }}</td>
              <td>{{ row.review_reason }}</td>
            </tr>
            {% endfor %}
          </tbody>
        </table>
      </div>
      {% else %}
      <p class="empty-state">No unclassified latest-period records were present.</p>
      {% endif %}
    </section>

    <section class="card">
      <h2>Visualizations</h2>
      <div class="charts">
        <div class="chart-card">
          <p>Recommendation score is plotted against support-driven confidence so strong-looking but weakly supported spikes stand out quickly.</p>
          <div class="chart-frame">{{ charts.score_vs_confidence | safe }}</div>
        </div>
        <div class="chart-card">
          <p>Review-item labels show where weak support is clustering across the latest period.</p>
          <div class="chart-frame">{{ charts.low_confidence_by_label | safe }}</div>
        </div>
        <div class="chart-card">
          <p>This compares current product share with the historical baseline for the strongest latest-period rows.</p>
          <div class="chart-frame">{{ charts.latest_vs_historical_share | safe }}</div>
        </div>
        <div class="chart-card">
          <p>Only High and Medium confidence rows are ranked here to keep the primary recommendation stack decision-safe.</p>
          <div class="chart-frame">{{ charts.top_high_confidence | safe }}</div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2>Validation Checks</h2>
      <div class="table-wrap">
        <table style="min-width: 900px;">
          <thead>
            <tr>
              <th>Check</th>
              <th>Status</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {% for item in validation_results %}
            <tr>
              <td>{{ item.name }}</td>
              <td class="{{ 'validation-pass' if item.status == 'PASS' else 'validation-fail' }}">{{ item.status }}</td>
              <td>{{ item.detail }}</td>
            </tr>
            {% endfor %}
          </tbody>
        </table>
      </div>
    </section>
  </div>

  <script>
    document.querySelectorAll("[data-tabs]").forEach(function(tabGroup) {
      var buttons = Array.from(tabGroup.querySelectorAll("[data-tab-button]"));
      var panels = Array.from(tabGroup.querySelectorAll("[data-tab-panel]"));

      buttons.forEach(function(button) {
        button.addEventListener("click", function() {
          var target = button.getAttribute("data-tab-button");
          buttons.forEach(function(item) {
            item.classList.toggle("active", item === button);
          });
          panels.forEach(function(panel) {
            panel.classList.toggle("active", panel.getAttribute("data-tab-panel") === target);
          });
        });
      });
    });
  </script>
</body>
</html>
"""


def main() -> int:
    args = parse_args()
    input_path = Path(args.input)
    output_dir = Path(args.output_dir)

    try:
        if not input_path.exists():
            raise FileNotFoundError(f"Input file not found: {input_path}")

        output_dir.mkdir(parents=True, exist_ok=True)
        print_progress(f"Reading input file: {input_path}")
        df = pd.read_csv(input_path)
        if df.empty:
            raise DataValidationError("The input CSV is empty.")

        df, schema = prepare_schema(df)
        transformed_df = calculate_time_aware_features(df, schema)
        latest_df = build_latest_recommendations(transformed_df, schema)
        primary_df = build_primary_recommendations(latest_df, schema)
        high_confidence_df = build_high_confidence_recommendations(primary_df)
        market_level_df = build_market_level_recommendations(high_confidence_df, schema)
        low_confidence_df = build_low_confidence_review_items(latest_df, schema)
        validation_results = run_validations(
            transformed_df=transformed_df,
            latest_df=latest_df,
            high_confidence_df=high_confidence_df,
            market_level_df=market_level_df,
            schema=schema,
        )

        export_dataframe(transformed_df, output_dir / "transformed_recommendation_data.csv")
        export_dataframe(latest_df, output_dir / "latest_period_recommendations.csv")
        export_dataframe(high_confidence_df, output_dir / "high_confidence_recommendations.csv")
        export_dataframe(low_confidence_df, output_dir / "low_confidence_review_items.csv")
        render_html_report(
            transformed_df=transformed_df,
            latest_df=latest_df,
            high_confidence_df=high_confidence_df,
            low_confidence_df=low_confidence_df,
            market_level_df=market_level_df,
            schema=schema,
            validation_results=validation_results,
            output_path=output_dir / "recommendation_report.html",
        )
        print_progress("Recommendation build complete")
        return 0

    except (DataValidationError, FileNotFoundError, pd.errors.EmptyDataError) as exc:
        print(f"[ERROR] {exc}", file=sys.stderr)
        return 1
    except Exception as exc:  # pragma: no cover
        print(f"[ERROR] Unexpected failure: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
