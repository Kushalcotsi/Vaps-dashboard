select year(Date), count(*) 
from ai_agent_logs.test.gs_sales_activation_view 
group by year(Date)
order by year(Date)
-- limit 10



-- Total Order Items ( Unit + Vaps )
select count(*) 
from ai_agent_logs.test.gs_sales_activation_view 
where quoted_stock_keeping_unit is not null ;

select count(*) 
from ai_agent_logs.test.gs_sales_activation_view 
where order_create_date is null

-- and vaps_parent_item is  null
--quoted_stock_keeping_unit is  null limit 10;
select year(order_create_date), count(*) 
from (
    select *
    from ai_agent_logs.test.gs_sales_activation_view 
    where quoted_stock_keeping_unit is not null ) sales_activations
group by year(order_create_date)
order by year(order_create_date);


-- Total Sales Documents & Unit Activations & Vaps Activations
select 
    'Unique Sales Activations',
    count(distinct sales_document_id) as "Sales Documents" ,
    sum(case when SALES_DOCUMENT_ITEM_NUMBER = HIGHER_LEVEL_SALES_DOCUMENT_ITEM_NUMBER then 1 else 0 end) "Unit Activations",
    sum(case when SALES_DOCUMENT_ITEM_NUMBER != HIGHER_LEVEL_SALES_DOCUMENT_ITEM_NUMBER and vaps_item = True then 1 else 0 end) "Vaps Activations"
from ( select *
        from ai_agent_logs.test.gs_sales_activation_view 
        where quoted_stock_keeping_unit is not null ) sales_activations

-- List of Units
select distinct sales_document_id,
sales_document_item_number,
higher_level_sales_document_item_number,
SF_SIC_CODE,
quoted_stock_keeping_unit as "unit_code",
material_description as "unit_description"
from ( select *
        from ai_agent_logs.test.gs_sales_activation_view 
        where quoted_stock_keeping_unit is not null ) sales_activations
where  SALES_DOCUMENT_ITEM_NUMBER = HIGHER_LEVEL_SALES_DOCUMENT_ITEM_NUMBER 
and year(order_create_date) in (2024,2025,2026)


-- List of only GLO BAsic units with market segments
select t1.*,t2.MARKET_SEGMENT_DESCRIPTION from
( select distinct sales_document_id,
sales_document_item_number,
higher_level_sales_document_item_number,
SF_SIC_CODE,
quoted_stock_keeping_unit as "unit_code",
material_description as "unit_description"
from ( select *
        from ai_agent_logs.test.gs_sales_activation_view 
        where quoted_stock_keeping_unit is not null ) sales_activations
where  SALES_DOCUMENT_ITEM_NUMBER = HIGHER_LEVEL_SALES_DOCUMENT_ITEM_NUMBER 
and year(order_create_date) in (2024,2025,2026) ) t1
left outer join ( select SIC_CODE::TEXT as SIC_CODE, MARKET_SEGMENT_DESCRIPTION from AI_AGENT_LOGS.TEST.GS_MARKET_SEGMENT_MAPPING QUALIFY ROW_NUMBER() OVER (PARTITION BY SIC_CODE ORDER BY MARKET_SEGMENT_DESCRIPTION) = 1) t2
on TRY_CAST(t1.sf_sic_code AS text) = TRY_CAST(t2.SIC_CODE AS text)
inner join (select case when unit_type is null then 'Basic' else unit_type end as "GLO Unit Category",*
from AI_AGENT_LOGS.TEST.GS_UNITS_MASTERS
where case when unit_type is null then 'Basic' else unit_type end = 'Basic') t3
on t1."unit_code" = t3.unit_productcode_sf



-- List of VAPS
select sales_document_id,
sales_document_item_number,
higher_level_sales_document_item_number,
quoted_stock_keeping_unit as "vaps_code",
material_description as "vaps_description"
from ( select *
        from ai_agent_logs.test.gs_sales_activation_view 
        where quoted_stock_keeping_unit is not null ) sales_activations
where  SALES_DOCUMENT_ITEM_NUMBER != HIGHER_LEVEL_SALES_DOCUMENT_ITEM_NUMBER 
and year(order_create_date) in (2024,2025,2026)
and vaps_item = True

-- Enrich VAPS Items with VAPS Master
select t1.*,t2.*
from ( select sales_document_id,
sales_document_item_number,
higher_level_sales_document_item_number,
quoted_stock_keeping_unit as "vaps_code",
material_description as "vaps_description"
from ( select *
        from ai_agent_logs.test.gs_sales_activation_view 
        where quoted_stock_keeping_unit is not null ) sales_activations
where  SALES_DOCUMENT_ITEM_NUMBER != HIGHER_LEVEL_SALES_DOCUMENT_ITEM_NUMBER 
and year(order_create_date) in (2024,2025,2026)
and vaps_item = True ) t1
left outer join (select * from AI_AGENT_LOGS.TEST.GS_VAPS_MASTER QUALIFY ROW_NUMBER() OVER (PARTITION BY vaps_id ORDER BY vaps_id) = 1) t2
on t1."vaps_code" = t2.vaps_id


-- Now Combine Units and Vaps associated with Units
create or replace view AI_AGENT_LOGS.TEST.gs_basic_units_with_vaps as
select unit_activations.*, 
vaps_activations."vaps_code",
vaps_activations."vaps_description_from_tran"
from
(select t1.*,t2.MARKET_SEGMENT_DESCRIPTION from
( select distinct sales_document_id,
sales_document_item_number,
higher_level_sales_document_item_number,
SF_SIC_CODE,
quoted_stock_keeping_unit as "unit_code",
material_description as "unit_description"
from ( select *
        from ai_agent_logs.test.gs_sales_activation_view 
        where quoted_stock_keeping_unit is not null ) sales_activations
where  SALES_DOCUMENT_ITEM_NUMBER = HIGHER_LEVEL_SALES_DOCUMENT_ITEM_NUMBER 
and year(order_create_date) in (2024,2025,2026) ) t1
left outer join ( select SIC_CODE::TEXT as SIC_CODE, MARKET_SEGMENT_DESCRIPTION from AI_AGENT_LOGS.TEST.GS_MARKET_SEGMENT_MAPPING QUALIFY ROW_NUMBER() OVER (PARTITION BY SIC_CODE ORDER BY MARKET_SEGMENT_DESCRIPTION) = 1) t2
on TRY_CAST(t1.sf_sic_code AS text) = TRY_CAST(t2.SIC_CODE AS text)
inner join (select case when unit_type is null then 'Basic' else unit_type end as "GLO Unit Category",*
from AI_AGENT_LOGS.TEST.GS_UNITS_MASTERS
where case when unit_type is null then 'Basic' else unit_type end = 'Basic') t3
on t1."unit_code" = t3.unit_productcode_sf)  unit_activations
left outer join 
(select t1.*,t2.*
from ( select sales_document_id,
sales_document_item_number,
higher_level_sales_document_item_number,
quoted_stock_keeping_unit as "vaps_code",
material_description as "vaps_description_from_tran"
from ( select *
        from ai_agent_logs.test.gs_sales_activation_view 
        where quoted_stock_keeping_unit is not null ) sales_activations
where  SALES_DOCUMENT_ITEM_NUMBER != HIGHER_LEVEL_SALES_DOCUMENT_ITEM_NUMBER
and year(order_create_date) in (2024,2025,2026)
and vaps_item = True ) t1
left outer join (select * from AI_AGENT_LOGS.TEST.GS_VAPS_MASTER QUALIFY ROW_NUMBER() OVER (PARTITION BY vaps_id ORDER BY vaps_id) = 1) t2
on t1."vaps_code" = t2.vaps_id) vaps_activations
on unit_activations.sales_document_id = vaps_activations.sales_document_id
and unit_activations.higher_level_sales_document_item_number = vaps_activations.higher_level_sales_document_item_number;



create or replace view AI_AGENT_LOGS.TEST.gs_unit_vaps_attach_rate as
select a."unit_code", 
a."vaps_code",
b."Unit_Activations",
a."Vaps_Associated_With_Unit",
ROUND(a."Vaps_Associated_With_Unit" / NULLIF(b."Unit_Activations", 0) * 100, 2) as "Vaps_Attach_Rate",
c.UNIT_PRODUCTNAME_SF,
c.UNIT_DESCRIPTION,
c.UNIT_DETAILEDDESCRIPTION,
c.UNIT_L1_PURPOSE,
c.UNIT_L2_CORE_SOLUTION,
c.UNIT_L3_PRODUCTS,
d.VAPS_DESCRIPTION,
d.VAPS_L1_PURPOSE,
d.VAPS_L2__CORE_NEED,
d.VAPS_L2_PRODUCTS,
d.VAPS_CUSTOMIZATION_COMPLEMENTARY_ALTERNATIVES,
d.VAPS_MAIN_GROUP,
d.VAPS_DETAILED_GROUP,
d.VAPS_PACKAGE_TIER,
d.VAPS_SOURCE
from (
    select "unit_code", "vaps_code", 
    count(*) as "Vaps_Associated_With_Unit"
    from AI_AGENT_LOGS.TEST.gs_basic_units_with_vaps
    group by "unit_code",  "vaps_code"
) a
left join (
    select "unit_code", count(distinct concat(sales_document_id, higher_level_sales_document_item_number)) as "Unit_Activations"
    from AI_AGENT_LOGS.TEST.gs_basic_units_with_vaps
    group by "unit_code"
) b on a."unit_code" = b."unit_code"
left join (
    select * from AI_AGENT_LOGS.TEST.GS_UNITS_MASTERS
    QUALIFY ROW_NUMBER() OVER (PARTITION BY UNIT_PRODUCTCODE_SF ORDER BY UNIT_PRODUCTCODE_SF) = 1
) c on a."unit_code" = c.UNIT_PRODUCTCODE_SF
left join (
    select * from AI_AGENT_LOGS.TEST.GS_VAPS_MASTER
    QUALIFY ROW_NUMBER() OVER (PARTITION BY VAPS_ID ORDER BY VAPS_ID) = 1
) d on a."vaps_code" = d.VAPS_ID;

create or replace view AI_AGENT_LOGS.TEST.gs_unit_market_segment_vaps_attach_rate as
select a."unit_code",
a.MARKET_SEGMENT_DESCRIPTION,
a."vaps_code",
b."Unit_Activations",
a."Vaps_Associated_With_Unit",
ROUND(a."Vaps_Associated_With_Unit" / NULLIF(b."Unit_Activations", 0) * 100, 2) as "Vaps_Attach_Rate",
c.UNIT_PRODUCTNAME_SF,
c.UNIT_DESCRIPTION,
c.UNIT_DETAILEDDESCRIPTION,
c.UNIT_L1_PURPOSE,
c.UNIT_L2_CORE_SOLUTION,
c.UNIT_L3_PRODUCTS,
d.VAPS_DESCRIPTION,
d.VAPS_L1_PURPOSE,
d.VAPS_L2__CORE_NEED,
d.VAPS_L2_PRODUCTS,
d.VAPS_CUSTOMIZATION_COMPLEMENTARY_ALTERNATIVES,
d.VAPS_MAIN_GROUP,
d.VAPS_DETAILED_GROUP,
d.VAPS_PACKAGE_TIER,
d.VAPS_SOURCE
from (
    select "unit_code", MARKET_SEGMENT_DESCRIPTION, "vaps_code",
    count(*) as "Vaps_Associated_With_Unit"
    from AI_AGENT_LOGS.TEST.gs_basic_units_with_vaps
    group by "unit_code", MARKET_SEGMENT_DESCRIPTION, "vaps_code"
) a
left join (
    select "unit_code", MARKET_SEGMENT_DESCRIPTION, count(distinct concat(sales_document_id, higher_level_sales_document_item_number)) as "Unit_Activations"
    from AI_AGENT_LOGS.TEST.gs_basic_units_with_vaps
    group by "unit_code", MARKET_SEGMENT_DESCRIPTION
) b on a."unit_code" = b."unit_code" and NVL(a.MARKET_SEGMENT_DESCRIPTION, '') = NVL(b.MARKET_SEGMENT_DESCRIPTION, '')
left join (
    select * from AI_AGENT_LOGS.TEST.GS_UNITS_MASTERS
    QUALIFY ROW_NUMBER() OVER (PARTITION BY UNIT_PRODUCTCODE_SF ORDER BY UNIT_PRODUCTCODE_SF) = 1
) c on a."unit_code" = c.UNIT_PRODUCTCODE_SF
left join (
    select * from AI_AGENT_LOGS.TEST.GS_VAPS_MASTER
    QUALIFY ROW_NUMBER() OVER (PARTITION BY VAPS_ID ORDER BY VAPS_ID) = 1
) d on a."vaps_code" = d.VAPS_ID

