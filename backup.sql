--
-- PostgreSQL database dump
--


-- Dumped from database version 16.4 (Debian 16.4-1.pgdg110+2)
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: tiger; Type: SCHEMA; Schema: -; Owner: gis_admin
--

CREATE SCHEMA tiger;


ALTER SCHEMA tiger OWNER TO gis_admin;

--
-- Name: tiger_data; Type: SCHEMA; Schema: -; Owner: gis_admin
--

CREATE SCHEMA tiger_data;


ALTER SCHEMA tiger_data OWNER TO gis_admin;

--
-- Name: topology; Type: SCHEMA; Schema: -; Owner: gis_admin
--

CREATE SCHEMA topology;


ALTER SCHEMA topology OWNER TO gis_admin;

--
-- Name: SCHEMA topology; Type: COMMENT; Schema: -; Owner: gis_admin
--

COMMENT ON SCHEMA topology IS 'PostGIS Topology schema';


--
-- Name: fuzzystrmatch; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS fuzzystrmatch WITH SCHEMA public;


--
-- Name: EXTENSION fuzzystrmatch; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION fuzzystrmatch IS 'determine similarities and distance between strings';


--
-- Name: postgis; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public;


--
-- Name: EXTENSION postgis; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis IS 'PostGIS geometry and geography spatial types and functions';


--
-- Name: postgis_tiger_geocoder; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder WITH SCHEMA tiger;


--
-- Name: EXTENSION postgis_tiger_geocoder; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_tiger_geocoder IS 'PostGIS tiger geocoder and reverse geocoder';


--
-- Name: postgis_topology; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS postgis_topology WITH SCHEMA topology;


--
-- Name: EXTENSION postgis_topology; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION postgis_topology IS 'PostGIS topology spatial types and functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: gis_admin
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    user_id integer,
    username character varying(50),
    action_type character varying(50) NOT NULL,
    client_ip character varying(45),
    action_details text,
    old_value jsonb,
    new_value jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.audit_logs OWNER TO gis_admin;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: gis_admin
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO gis_admin;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gis_admin
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: circles; Type: TABLE; Schema: public; Owner: gis_admin
--

CREATE TABLE public.circles (
    id integer NOT NULL,
    district_id integer,
    name character varying(100) NOT NULL,
    code character varying(20),
    geom public.geometry(Polygon,4326),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.circles OWNER TO gis_admin;

--
-- Name: circles_id_seq; Type: SEQUENCE; Schema: public; Owner: gis_admin
--

CREATE SEQUENCE public.circles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.circles_id_seq OWNER TO gis_admin;

--
-- Name: circles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gis_admin
--

ALTER SEQUENCE public.circles_id_seq OWNED BY public.circles.id;


--
-- Name: districts; Type: TABLE; Schema: public; Owner: gis_admin
--

CREATE TABLE public.districts (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(20),
    geom public.geometry(Polygon,4326),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.districts OWNER TO gis_admin;

--
-- Name: districts_id_seq; Type: SEQUENCE; Schema: public; Owner: gis_admin
--

CREATE SEQUENCE public.districts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.districts_id_seq OWNER TO gis_admin;

--
-- Name: districts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gis_admin
--

ALTER SEQUENCE public.districts_id_seq OWNED BY public.districts.id;


--
-- Name: gis_layers; Type: TABLE; Schema: public; Owner: gis_admin
--

CREATE TABLE public.gis_layers (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(150) NOT NULL,
    category_id integer,
    layer_type character varying(20) DEFAULT 'Vector'::character varying,
    source_type character varying(20) DEFAULT 'PostGIS'::character varying,
    is_published boolean DEFAULT true,
    display_order integer DEFAULT 0,
    style_config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.gis_layers OWNER TO gis_admin;

--
-- Name: gis_layers_id_seq; Type: SEQUENCE; Schema: public; Owner: gis_admin
--

CREATE SEQUENCE public.gis_layers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.gis_layers_id_seq OWNER TO gis_admin;

--
-- Name: gis_layers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gis_admin
--

ALTER SEQUENCE public.gis_layers_id_seq OWNED BY public.gis_layers.id;


--
-- Name: industrial_estates; Type: TABLE; Schema: public; Owner: gis_admin
--

CREATE TABLE public.industrial_estates (
    id integer NOT NULL,
    district_id integer,
    name character varying(150) NOT NULL,
    total_area_acres numeric(10,2) NOT NULL,
    allocated_area_acres numeric(10,2) DEFAULT 0.00,
    available_area_acres numeric(10,2) DEFAULT 0.00,
    power_capacity_mw numeric(6,2) DEFAULT 0.00,
    water_capacity_mld numeric(6,2) DEFAULT 0.00,
    gas_pipeline_available boolean DEFAULT false,
    drainage_available boolean DEFAULT false,
    contact_person character varying(100),
    contact_phone character varying(20),
    geom public.geometry(Polygon,4326),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.industrial_estates OWNER TO gis_admin;

--
-- Name: industrial_estates_id_seq; Type: SEQUENCE; Schema: public; Owner: gis_admin
--

CREATE SEQUENCE public.industrial_estates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.industrial_estates_id_seq OWNER TO gis_admin;

--
-- Name: industrial_estates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gis_admin
--

ALTER SEQUENCE public.industrial_estates_id_seq OWNED BY public.industrial_estates.id;


--
-- Name: infrastructure_layers; Type: TABLE; Schema: public; Owner: gis_admin
--

CREATE TABLE public.infrastructure_layers (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    infra_type character varying(50) NOT NULL,
    attributes jsonb DEFAULT '{}'::jsonb,
    geom public.geometry(LineString,4326) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.infrastructure_layers OWNER TO gis_admin;

--
-- Name: infrastructure_layers_id_seq; Type: SEQUENCE; Schema: public; Owner: gis_admin
--

CREATE SEQUENCE public.infrastructure_layers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.infrastructure_layers_id_seq OWNER TO gis_admin;

--
-- Name: infrastructure_layers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gis_admin
--

ALTER SEQUENCE public.infrastructure_layers_id_seq OWNED BY public.infrastructure_layers.id;


--
-- Name: integration_adapters; Type: TABLE; Schema: public; Owner: gis_admin
--

CREATE TABLE public.integration_adapters (
    id integer NOT NULL,
    system_name character varying(100) NOT NULL,
    endpoint_url text,
    auth_config jsonb DEFAULT '{}'::jsonb,
    is_enabled boolean DEFAULT false,
    sync_interval_seconds integer DEFAULT 3600,
    last_sync_status character varying(50),
    last_sync_at timestamp with time zone
);


ALTER TABLE public.integration_adapters OWNER TO gis_admin;

--
-- Name: integration_adapters_id_seq; Type: SEQUENCE; Schema: public; Owner: gis_admin
--

CREATE SEQUENCE public.integration_adapters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.integration_adapters_id_seq OWNER TO gis_admin;

--
-- Name: integration_adapters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gis_admin
--

ALTER SEQUENCE public.integration_adapters_id_seq OWNED BY public.integration_adapters.id;


--
-- Name: land_parcels; Type: TABLE; Schema: public; Owner: gis_admin
--

CREATE TABLE public.land_parcels (
    id integer NOT NULL,
    estate_id integer,
    parcel_id character varying(50) NOT NULL,
    plot_number character varying(50) NOT NULL,
    survey_number character varying(50),
    village_id integer,
    area_acres numeric(10,2) NOT NULL,
    availability_status character varying(50) DEFAULT 'Available'::character varying,
    land_classification character varying(100) DEFAULT 'General'::character varying,
    ownership_details character varying(255) DEFAULT 'Government Land Bank'::character varying,
    infrastructure_details jsonb DEFAULT '{}'::jsonb,
    photo_urls text[],
    geom public.geometry(Polygon,4326) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.land_parcels OWNER TO gis_admin;

--
-- Name: land_parcels_id_seq; Type: SEQUENCE; Schema: public; Owner: gis_admin
--

CREATE SEQUENCE public.land_parcels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.land_parcels_id_seq OWNER TO gis_admin;

--
-- Name: land_parcels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gis_admin
--

ALTER SEQUENCE public.land_parcels_id_seq OWNED BY public.land_parcels.id;


--
-- Name: layer_categories; Type: TABLE; Schema: public; Owner: gis_admin
--

CREATE TABLE public.layer_categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    display_order integer DEFAULT 0
);


ALTER TABLE public.layer_categories OWNER TO gis_admin;

--
-- Name: layer_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: gis_admin
--

CREATE SEQUENCE public.layer_categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.layer_categories_id_seq OWNER TO gis_admin;

--
-- Name: layer_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gis_admin
--

ALTER SEQUENCE public.layer_categories_id_seq OWNED BY public.layer_categories.id;


--
-- Name: layer_metadata; Type: TABLE; Schema: public; Owner: gis_admin
--

CREATE TABLE public.layer_metadata (
    id integer NOT NULL,
    layer_id integer,
    description text,
    source_department character varying(150),
    data_owner character varying(150),
    coordinate_reference_system character varying(50) DEFAULT 'EPSG:4326'::character varying,
    scale character varying(50) DEFAULT '1:5000'::character varying,
    version character varying(20) DEFAULT '1.0'::character varying,
    license character varying(100) DEFAULT 'Open Government Data License'::character varying,
    keywords text[],
    last_updated timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.layer_metadata OWNER TO gis_admin;

--
-- Name: layer_metadata_id_seq; Type: SEQUENCE; Schema: public; Owner: gis_admin
--

CREATE SEQUENCE public.layer_metadata_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.layer_metadata_id_seq OWNER TO gis_admin;

--
-- Name: layer_metadata_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gis_admin
--

ALTER SEQUENCE public.layer_metadata_id_seq OWNED BY public.layer_metadata.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: gis_admin
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text
);


ALTER TABLE public.roles OWNER TO gis_admin;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: gis_admin
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO gis_admin;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gis_admin
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: gis_admin
--

CREATE TABLE public.system_settings (
    id integer NOT NULL,
    setting_key character varying(100) NOT NULL,
    setting_value text NOT NULL,
    description text
);


ALTER TABLE public.system_settings OWNER TO gis_admin;

--
-- Name: system_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: gis_admin
--

CREATE SEQUENCE public.system_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_settings_id_seq OWNER TO gis_admin;

--
-- Name: system_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gis_admin
--

ALTER SEQUENCE public.system_settings_id_seq OWNED BY public.system_settings.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: gis_admin
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(100),
    email character varying(100),
    role_id integer,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.users OWNER TO gis_admin;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: gis_admin
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO gis_admin;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gis_admin
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: villages; Type: TABLE; Schema: public; Owner: gis_admin
--

CREATE TABLE public.villages (
    id integer NOT NULL,
    circle_id integer,
    name character varying(100) NOT NULL,
    code character varying(20),
    geom public.geometry(Polygon,4326),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.villages OWNER TO gis_admin;

--
-- Name: villages_id_seq; Type: SEQUENCE; Schema: public; Owner: gis_admin
--

CREATE SEQUENCE public.villages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.villages_id_seq OWNER TO gis_admin;

--
-- Name: villages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: gis_admin
--

ALTER SEQUENCE public.villages_id_seq OWNED BY public.villages.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: circles id; Type: DEFAULT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.circles ALTER COLUMN id SET DEFAULT nextval('public.circles_id_seq'::regclass);


--
-- Name: districts id; Type: DEFAULT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.districts ALTER COLUMN id SET DEFAULT nextval('public.districts_id_seq'::regclass);


--
-- Name: gis_layers id; Type: DEFAULT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.gis_layers ALTER COLUMN id SET DEFAULT nextval('public.gis_layers_id_seq'::regclass);


--
-- Name: industrial_estates id; Type: DEFAULT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.industrial_estates ALTER COLUMN id SET DEFAULT nextval('public.industrial_estates_id_seq'::regclass);


--
-- Name: infrastructure_layers id; Type: DEFAULT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.infrastructure_layers ALTER COLUMN id SET DEFAULT nextval('public.infrastructure_layers_id_seq'::regclass);


--
-- Name: integration_adapters id; Type: DEFAULT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.integration_adapters ALTER COLUMN id SET DEFAULT nextval('public.integration_adapters_id_seq'::regclass);


--
-- Name: land_parcels id; Type: DEFAULT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.land_parcels ALTER COLUMN id SET DEFAULT nextval('public.land_parcels_id_seq'::regclass);


--
-- Name: layer_categories id; Type: DEFAULT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.layer_categories ALTER COLUMN id SET DEFAULT nextval('public.layer_categories_id_seq'::regclass);


--
-- Name: layer_metadata id; Type: DEFAULT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.layer_metadata ALTER COLUMN id SET DEFAULT nextval('public.layer_metadata_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: system_settings id; Type: DEFAULT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.system_settings ALTER COLUMN id SET DEFAULT nextval('public.system_settings_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: villages id; Type: DEFAULT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.villages ALTER COLUMN id SET DEFAULT nextval('public.villages_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: gis_admin
--

COPY public.audit_logs (id, user_id, username, action_type, client_ip, action_details, old_value, new_value, created_at) FROM stdin;
1	1	gisadmin	LOGIN	127.0.0.1	User gisadmin logged in successfully.	\N	\N	2026-09-17 06:17:28.167629+00
2	1	gisadmin	LOGIN	172.18.0.2	User gisadmin logged in successfully.	\N	\N	2026-09-17 06:18:25.381832+00
3	1	gisadmin	LOGIN	172.18.0.2	User gisadmin logged in successfully.	\N	\N	2026-09-17 06:18:32.271492+00
4	1	gisadmin	LOGIN	127.0.0.1	User gisadmin logged in successfully.	\N	\N	2026-09-17 06:21:17.845484+00
5	1	gisadmin	LOGIN	127.0.0.1	User gisadmin logged in successfully.	\N	\N	2026-09-17 06:21:40.891986+00
6	1	gisadmin	LOGIN	127.0.0.1	User gisadmin logged in successfully.	\N	\N	2026-09-17 06:21:50.406777+00
7	1	gisadmin	LOGIN	172.18.0.2	User gisadmin logged in successfully.	\N	\N	2026-09-17 06:23:26.557608+00
8	1	gisadmin	UPLOAD_GIS	172.18.0.2	Successfully parsed and published GIS layer: Amerigog_inner_boundary from file Amerigog inner boundary.shp.	\N	\N	2026-09-17 06:23:47.471625+00
9	\N		MODIFY_LAYER	172.18.0.2	Modified GIS Catalog Layer: Amerigog_inner_boundary	{"id": 3, "name": "amerigog_inner_boundary", "category": 2, "created_at": "2026-09-17T06:23:47.451976Z", "layer_type": "Polygon", "source_type": "PostGIS", "display_name": "Amerigog_inner_boundary", "is_published": true, "style_config": {"fill": "rgba(2, 132, 199, 0.2)", "outline": "#0369a1"}, "category_name": "Industrial Assets", "display_order": 1}	{"id": 3, "name": "amerigog_inner_boundary", "category": 2, "created_at": "2026-09-17T06:23:47.451976Z", "layer_type": "Polygon", "source_type": "PostGIS", "display_name": "Amerigog_inner_boundary", "is_published": true, "style_config": {"fill": "rgba(2, 132, 199, 0.2)", "outline": "#0369a1"}, "category_name": "Industrial Assets", "display_order": 1}	2026-09-17 06:24:20.096679+00
10	\N		MODIFY_LAYER	172.18.0.2	Modified GIS Catalog Layer: Amerigog_inner_boundary	{"id": 3, "name": "amerigog_inner_boundary", "category": 2, "created_at": "2026-09-17T06:23:47.451976Z", "layer_type": "Polygon", "source_type": "PostGIS", "display_name": "Amerigog_inner_boundary", "is_published": true, "style_config": {"fill": "rgba(2, 132, 199, 0.2)", "outline": "#0369a1"}, "category_name": "Industrial Assets", "display_order": 1}	{"id": 3, "name": "amerigog_inner_boundary", "category": 2, "created_at": "2026-09-17T06:23:47.451976Z", "layer_type": "Polygon", "source_type": "PostGIS", "display_name": "Amerigog_inner_boundary", "is_published": true, "style_config": {"fill": "rgba(2, 132, 199, 0.2)", "outline": "#0369a1"}, "category_name": "Industrial Assets", "display_order": 1}	2026-09-17 06:28:15.856705+00
11	\N		MODIFY_LAYER	172.18.0.2	Modified GIS Catalog Layer: Amerigog_inner_boundary	{"id": 3, "name": "amerigog_inner_boundary", "category": 2, "created_at": "2026-09-17T06:23:47.451976Z", "layer_type": "Polygon", "source_type": "PostGIS", "display_name": "Amerigog_inner_boundary", "is_published": true, "style_config": {"fill": "rgba(2, 132, 199, 0.2)", "outline": "#0369a1"}, "category_name": "Industrial Assets", "display_order": 1}	{"id": 3, "name": "amerigog_inner_boundary", "category": 2, "created_at": "2026-09-17T06:23:47.451976Z", "layer_type": "Polygon", "source_type": "PostGIS", "display_name": "Amerigog_inner_boundary", "is_published": true, "style_config": {"fill": "rgba(2, 132, 199, 0.2)", "outline": "#0369a1"}, "category_name": "Industrial Assets", "display_order": 1}	2026-09-17 06:40:50.539425+00
12	1	gisadmin	UPLOAD_GIS	172.18.0.2	Successfully parsed and published GIS layer: Bonda_inner_boundary from file Bonda inner boundary.shp.	\N	\N	2026-09-17 06:45:21.421107+00
13	1	gisadmin	UPLOAD_GIS	172.18.0.2	Successfully parsed and published GIS layer: Chouhdhuripara_inner_boundary from file Chouhdhuripara inner boundary.shp.	\N	\N	2026-09-17 06:51:37.584229+00
14	\N		DELETE_LAYER	172.18.0.2	Cascadingly deleted GIS Catalog Layer ID 5 (Chouhdhuripara_inner_boundary) along with associated PostGIS estates and parcels.	\N	\N	2026-09-17 07:01:09.676488+00
15	1	gisadmin	UPLOAD_GIS	172.18.0.2	Successfully parsed and published GIS layer: Chouhdhuripara_inner_boundary from file Chouhdhuripara inner boundary.shp.	\N	\N	2026-09-17 07:19:19.611854+00
16	1	gisadmin	UPLOAD_GIS	172.18.0.2	Successfully parsed and published GIS layer: Dhing_Gaon_inner_Boundary from file Dhing Gaon inner Boundary.shp.	\N	\N	2026-09-17 07:20:17.882942+00
17	1	gisadmin	UPLOAD_GIS	172.18.0.2	Successfully parsed and published GIS layer: Dolai_gaon_part_3_inner_boundary from file Dolai gaon part_3 inner boundary.shp.	\N	\N	2026-09-17 07:21:04.890695+00
18	1	gisadmin	UPLOAD_GIS	172.18.0.2	Successfully parsed and published GIS layer: Nakhola_Grant_inner_boundary from file Nakhola Grant inner boundary.shp.	\N	\N	2026-09-17 07:22:26.371303+00
19	1	gisadmin	UPLOAD_GIS	172.18.0.2	Successfully parsed and published GIS layer: Naltali_inner_boundary from file Naltali inner boundary.shp.	\N	\N	2026-09-17 07:23:21.214433+00
20	1	gisadmin	LOGIN	172.18.0.2	User gisadmin logged in successfully.	\N	\N	2026-09-17 07:25:14.329769+00
21	\N		DELETE_LAYER	172.18.0.2	Cascadingly deleted GIS Catalog Layer ID 11 (Namali_Jalah_inner_boundary) along with associated PostGIS estates and parcels.	\N	\N	2026-09-17 07:26:26.889445+00
22	1	gisadmin	UPLOAD_GIS	172.18.0.2	Successfully parsed and published GIS layer: Namali_Jalah_inner_boundary from file No_1 Nowpara inner boundary.shp.	\N	\N	2026-09-17 07:27:11.969063+00
23	1	gisadmin	UPLOAD_GIS	172.18.0.2	Successfully parsed and published GIS layer: No_1_Nowpara_inner_boundary from file No_1 Nowpara inner boundary.shp.	\N	\N	2026-09-17 07:29:30.391435+00
24	1	gisadmin	UPLOAD_GIS	172.18.0.2	Successfully parsed and published GIS layer: No_2_Japorigog_inner_boundary from file No_2_Japorigog inner boundary.shp.	\N	\N	2026-09-17 07:30:11.972869+00
25	1	gisadmin	UPLOAD_GIS	172.18.0.2	Successfully parsed and published GIS layer: Paschim_Jalukbari_inner_boundary from file Paschim_Jalukbari inner boundary.shp.	\N	\N	2026-09-17 07:36:56.012209+00
26	1	gisadmin	UPLOAD_GIS	172.18.0.2	Successfully parsed and published GIS layer: Sarusajai_inner_boundary from file Sarusajai inner boundary.shp.	\N	\N	2026-09-17 07:38:11.249534+00
27	1	gisadmin	LOGIN	172.18.0.2	User gisadmin logged in successfully.	\N	\N	2026-09-17 07:40:49.431501+00
28	\N		DELETE_LAYER	172.18.0.2	Cascadingly deleted GIS Catalog Layer ID 21 (No_2_Japorigog_inner_boundary) along with associated PostGIS estates and parcels.	\N	\N	2026-09-17 08:29:12.996642+00
29	1	gisadmin	LOGIN	172.18.0.3	User gisadmin logged in successfully.	\N	\N	2026-09-19 06:13:25.781482+00
30	1	gisadmin	LOGIN	172.18.0.3	User gisadmin logged in successfully.	\N	\N	2026-09-19 07:38:54.627562+00
31	1	gisadmin	UPLOAD_GIS	172.18.0.3	Successfully parsed and published GIS layer: No_2_Japorigog_inner_boundary from file No_2_Japorigog inner boundary.shp.	\N	\N	2026-09-19 09:55:27.887857+00
\.


--
-- Data for Name: circles; Type: TABLE DATA; Schema: public; Owner: gis_admin
--

COPY public.circles (id, district_id, name, code, geom, created_at) FROM stdin;
\.


--
-- Data for Name: districts; Type: TABLE DATA; Schema: public; Owner: gis_admin
--

COPY public.districts (id, name, code, geom, created_at) FROM stdin;
\.


--
-- Data for Name: gis_layers; Type: TABLE DATA; Schema: public; Owner: gis_admin
--

COPY public.gis_layers (id, name, display_name, category_id, layer_type, source_type, is_published, display_order, style_config, created_at) FROM stdin;
3	amerigog_inner_boundary	Amerigog_inner_boundary	2	Polygon	PostGIS	t	1	{"fill": "rgba(2, 132, 199, 0.2)", "outline": "#0369a1"}	2026-09-17 06:23:47.451976+00
4	bonda_inner_boundary	Bonda_inner_boundary	2	Polygon	PostGIS	t	1	{"fill": "rgba(2, 132, 199, 0.2)", "outline": "#0369a1"}	2026-09-17 06:45:21.392547+00
6	chouhdhuripara_inner_boundary	Chouhdhuripara_inner_boundary	2	Polygon	PostGIS	t	1	{"fill": "rgba(2, 132, 199, 0.2)", "outline": "#0369a1"}	2026-09-17 07:19:19.591691+00
7	dhing_gaon_inner_boundary	Dhing_Gaon_inner_Boundary	2	Polygon	PostGIS	t	1	{"fill": "rgba(2, 132, 199, 0.2)", "outline": "#0369a1"}	2026-09-17 07:20:17.855633+00
8	dolai_gaon_part_3_inner_boundary	Dolai_gaon_part_3_inner_boundary	2	Polygon	PostGIS	t	1	{"fill": "rgba(2, 132, 199, 0.2)", "outline": "#0369a1"}	2026-09-17 07:21:04.871035+00
9	nakhola_grant_inner_boundary	Nakhola_Grant_inner_boundary	2	Polygon	PostGIS	t	1	{"fill": "rgba(2, 132, 199, 0.2)", "outline": "#0369a1"}	2026-09-17 07:22:26.348629+00
10	naltali_inner_boundary	Naltali_inner_boundary	2	Polygon	PostGIS	t	1	{"fill": "rgba(2, 132, 199, 0.2)", "outline": "#0369a1"}	2026-09-17 07:23:21.197878+00
18	namali_jalah_inner_boundary	Namali_Jalah_inner_boundary	2	Polygon	PostGIS	t	1	{"fill": "rgba(2, 132, 199, 0.2)", "outline": "#0369a1"}	2026-09-17 07:26:51.362191+00
20	no_1_nowpara_inner_boundary	No_1_Nowpara_inner_boundary	2	Polygon	PostGIS	t	1	{"fill": "rgba(2, 132, 199, 0.2)", "outline": "#0369a1"}	2026-09-17 07:29:30.355564+00
22	paschim_jalukbari_inner_boundary	Paschim_Jalukbari_inner_boundary	2	Polygon	PostGIS	t	1	{"fill": "rgba(2, 132, 199, 0.2)", "outline": "#0369a1"}	2026-09-17 07:36:55.990078+00
23	sarusajai_inner_boundary	Sarusajai_inner_boundary	2	Polygon	PostGIS	t	1	{"fill": "rgba(2, 132, 199, 0.2)", "outline": "#0369a1"}	2026-09-17 07:38:11.231806+00
24	no_2_japorigog_inner_boundary	No_2_Japorigog_inner_boundary	2	Polygon	PostGIS	t	1	{"fill": "rgba(2, 132, 199, 0.2)", "outline": "#0369a1"}	2026-09-19 09:55:27.339133+00
\.


--
-- Data for Name: industrial_estates; Type: TABLE DATA; Schema: public; Owner: gis_admin
--

COPY public.industrial_estates (id, district_id, name, total_area_acres, allocated_area_acres, available_area_acres, power_capacity_mw, water_capacity_mld, gas_pipeline_available, drainage_available, contact_person, contact_phone, geom, created_at) FROM stdin;
2	\N	Amerigog_inner_boundary Industrial Area	10.36	0.00	10.36	10.00	5.00	t	t	\N	\N	0103000020E610000001000000220000002F53445BB0F856405E3FDC49981B3A40717284ACB3F85640050744AF8E1B3A406B42B03DB7F856406F00D478891B3A40E1FB54A1BAF85640176EEA21861B3A40F4D67DAABDF856401E0A9C99851B3A4034C5A1E1D8F8564071B854E4AD1B3A40D9748218DCF856404D224D2CAB1B3A407929BAFBDEF85640C71378FD9F1B3A400C2372B1DFF85640524BA21F991B3A4004BD2E28E0F856408E5AE34C8C1B3A405B7CB7EADFF85640A635C6D6831B3A40F784BA04DEF856405474EA05801B3A40C1BCE61EDEF85640FF007173791B3A40F47BFA71D0F856404EFF7D004B1B3A409EBFFDABC6F85640B64B265C1C1B3A4004C7F3CCC3F8564026E9A4A7201B3A402974F98AC1F856409F369426221B3A4095A0CC1CBFF856409484FD53231B3A402E1362E4BDF856400F65BF1B261B3A4028F536D7BCF85640BD0BC7C52A1B3A40FDC718C9BBF85640CA088F00311B3A4023278EE7BAF85640B5668FEC361B3A408C5EF71CBAF856402735A5983B1B3A40FD1F0D32B8F85640A591AAEB3F1B3A400ACA59ACB5F856401C236F49431B3A4025435AB6B2F85640517BD2D4481B3A401B2996C8B0F85640DC8617DA511B3A400611765EAFF85640BCC0AD645D1B3A4098644F8FAEF85640441C5E94691B3A40A9323801AEF8564087275147781B3A40E0EB0CF9ADF85640BF06C8BD851B3A405AF2468FAEF85640F593A4368E1B3A40ECE52928AFF85640A44D664D921B3A402F53445BB0F856405E3FDC49981B3A40	2026-09-17 06:23:47.457184+00
3	\N	Bonda_inner_boundary Industrial Area	29.85	22.96	6.89	10.00	5.00	t	t	\N	\N	0103000020E6100000010000001F00000045393BFAF1F55640BC8A52911F2F3A401D7AA23CF1F5564035009A00E42E3A40446D9D4EE7F55640434FB5FABA2E3A401B2EE267E0F55640291B82ACCC2E3A40B1B29B69DEF55640C948D1C8D12E3A4068619F06DBF556403317EDD9DB2E3A401980A353DAF556402F3A2266DC2E3A40F07D5FE2DAF5564084883AEDDF2E3A40EA14DCB3DBF55640FC73224DE22E3A40AB285F86DAF556405B77BDECE42E3A40708762A9D9F556402BCDC52CE32E3A403A8118AAD8F55640492B79FCE22E3A40CD1A88CCD6F556407C302B15E32E3A4048694EC4D0F55640CBAFB2ACF52E3A4008BD5C31D1F55640AE16C2D1F82E3A400C366E39D5F5564017B4216C0B2F3A403A24C8E0D5F55640E771E7300A2F3A40625D47C8D6F556406CE9ACE10C2F3A40D01B2CB0D7F55640C36326F20E2F3A40D7C2D103DAF5564043586D48152F3A40415C825EDCF55640FA4B190A222F3A40C91E4586E4F556402DC97A0E452F3A4002041251EAF556401CE0E1EA5E2F3A40B81ABBC4EFF556405243271B762F3A405E428B67F5F556407C7371D9652F3A40765A5BC7F8F5564073C5673B5A2F3A409F7703E8F4F55640334432384B2F3A4084A55AA7F5F55640F9E4562C472F3A400F065C0FF9F556404767ECF2362F3A40793EFC1EF4F55640D814AB0B212F3A4045393BFAF1F55640BC8A52911F2F3A40	2026-09-17 06:45:21.397854+00
5	\N	Chouhdhuripara_inner_boundary Industrial Area	36.66	0.00	32.60	10.00	5.00	t	t	\N	\N	0103000020E610000001000000B7000000D162871EB6D25640974B7C87140A3A40C40DB12EB7D25640D41632C3050A3A40B9E5A2F7B9D25640055ACFCBE0093A40AA4EC761BAD25640B82BABF5D9093A406DC39072BAD25640E313BB34D6093A40C97C56F2B8D25640AD3E7336CD093A4069E1E618B1D2564085744D14C6093A40B95AE9A5A5D25640619EF764BB093A40C447771D97D25640A62F1F37AE093A402905929791D25640DCC7F3CDB1093A4047B1294991D25640BDFAD56CB7093A403137AC1691D25640586B64A4BB093A402F2A88B090D256404252B928BE093A407D34F53D90D25640F8B308BCBF093A40D7E440A48FD2564064FD1975C0093A40E251CFE98ED2564053DD5B9CC0093A401B628A2F8ED25640C2A38993C0093A40A33D45548DD256406D060641C0093A40C355396E8CD256405670BE34BD093A409B2C5B868BD2564005A7609FA6093A40E5E894A38BD25640E8AE76CFA3093A40F1893F538CD256406B2371EEA0093A403E78DE228DD25640B81B95779F093A40F94202F88DD2564094EB8B399F093A40C92CD8E08ED25640B2A992449F093A405BA575C88FD25640879B25A0A0093A409D765F3E90D25640FAA9A39EA2093A407E258A2D91D25640C8286D2DAA093A4046CB526291D25640C16624A8AA093A40CDAF4DFB96D2564000F7A502A8093A4049669DA197D256408394850AA8093A407BF0126BA3D25640BA4704BEB2093A40E021E429ABD25640184BF3DEB9093A40F348006FB1D25640131E4255BF093A40D3C6A014B7D25640EED5EB93C4093A40B782164FB9D256404E10B877C6093A409D4E83B1BBD256402E1F1222C1093A40F2FC0B7CBCD256408CB82CFABD093A40064CE433BFD2564023CC8AE895093A4087D5EB9AC0D256403FAAAFA780093A4055B8F7FAC2D25640F7A88BFA59093A409EAD8E9CC4D25640E4641A2546093A40E968B5D0C5D25640340AAB582E093A40170D40B7C8D256409BEA033531093A4037F0907CC6D25640EC11E57953093A40D84F0F9CC4D25640485EE1956A093A402A236BA0C2D256403C41D74082093A40B2287B57C1D25640768B63C193093A40B35C1AF1C0D2564051567E1F9A093A40115ED325C0D25640734F0943A5093A40C392A267BFD2564000434EA3B0093A404229C963BED25640070DD761BF093A405E884851BED25640E167E565C1093A402C2F806ABED2564019EFC7E7C2093A40F22183E4BFD2564098448C6DCB093A4079A2F35AC0D2564092DFCBDBCC093A407A9ED0A9C1D2564056D02A18CE093A4070C4A508C4D25640764FC839D0093A40DD8BED36C9D25640FDE09006D5093A4058EB055CCDD256409F6C5ACAD8093A40EEBF8606D1D25640506C1A04DC093A40EE66B02ED5D256402ECD2610E0093A40A5282A44D8D25640D28F868EE2093A400082A806DBD2564006D3E3D8E4093A408CCE368ADDD25640001F26D8E6093A40C2A7472CDFD25640BD30690CE8093A40286BD438E1D256403499AD39E9093A401D036DA6E6D2564087FBAC53EA093A40765F51D4E9D25640E6C59D9AEB093A404EB0378EEDD25640944E0294EC093A40DEC1393EF1D25640CCB8E274ED093A40F58C7D97F4D256409718CB99EE093A406C6A94CFF7D256406D7316A5EF093A409BF445AAFAD2564035031AF4F0093A4034242120FED25640DE10048FF3093A404ADE819601D356409691B099F5093A409088BB8B03D356403730D9D1F6093A404D8ECC0505D35640FCAA3D1CF8093A402B48D97D05D35640E320C0CDF7093A4008BF91E605D35640F524E315F6093A406E59F02706D35640BE01E3BFF3093A403413858106D3564049AAE7D0EC093A4008FA8C0B07D3564007AD9B41E0093A40AB79081008D3564025DB1231CD093A405952DF8508D35640EBB8997AC4093A40913BA5CF08D356409D0576A6BC093A40693DA9A608D35640E8EC6633BA093A406D6FCE6208D35640BEC23407B8093A40B4DADBE407D356405FF961EBB3093A4031263EB907D35640205CDAB7B0093A4039F574D607D35640603CEEE7AD093A403B316F2508D35640606D6B3EAB093A4058CCF5C608D35640F5A51A41A9093A40BF71D06309D35640945D3DB8A8093A40C4D244140BD356407F729BC0A8093A401E04945C0BD35640991973B4A9093A40AB3E3E110CD35640B2C01A34AC093A403F3E7F970CD35640B0AE99ECB0093A40617F715C0CD35640572A9FD3B4093A40C39C5AF80BD35640370C7022B8093A40114654D10AD35640FFB08362BC093A401F3258360AD35640C3967818BF093A401A4796C209D356406954735BC4093A40C51FD93007D3564041685B16F8093A403751FEBD06D356407745ED5EFC093A40CE74B17C05D3564052070A0DFF093A40AF251EBA04D356407C59229AFF093A40E954027602D35640577EC857FD093A4073819640FED256401E1E293BF9093A4022D2C6AFF8D2564018BF9708F6093A40372918F3EAD25640C6ACD578F1093A4060FD6E97DDD25640C5C693EDEC093A40F257B693BFD256401A1985A3D3093A40B0127878BCD25640C8DA892AD9093A402D70A80FBBD25640DA8E9A8EE8093A406DC8E911B9D256403B09C412030A3A401E8DB4EAB7D256409860ECA7140A3A409755D679D9D25640CB544105170A3A403DB32508DCD25640592C0B09FF093A40F99C761FDED25640EB4240CBEF093A40CFDA8779F9D2564000EAE8C5020A3A40E50FD1EFFAD25640763A61C3F9093A40D73C435211D3564004C497CD140A3A40C0A0876114D35640B56ACD38DD093A4038D1D13A14D35640C84C291CD7093A407786A2D913D356402CE64746D4093A40D610E02B14D35640DF8DD847CF093A40C0A33B1C15D356401B276B2FC7093A401727D72C16D3564009230431C0093A408A5DE95317D356401BFF86E3B8093A40CA785C8C17D356406095AECDB7093A408D0FE9D415D356404E24F356B3093A403EE6DE7514D35640E8168734AF093A400F1548D013D3564089B95C64AE093A4077B8A80C0FD356404DEDDF2AAE093A40B13322F10CD35640BA2790FFA9093A4039F2EEFF0AD35640E8944107A8093A4033D1F96807D35640922F4773A6093A40B9E790BA04D35640DFBD673AA5093A409A3A851602D35640761161CAA4093A40D16B5CE000D35640E85F9B6BA4093A40E36CB31801D3564035FAE070BB093A40D1CC3C4CF6D25640E424D6E5CA093A40A077A8B5FAD25640ADEC66B9D8093A40F9B7EEF1F9D256406653C783E0093A405DC6AF63EDD25640CB667CB8C6093A40C88067D3ECD256403796BFD9C6093A40B7366806ECD256400C6F4DA8D8093A4086E95AC8E5D256404BA996EDD9093A400BBC15F4E1D25640D2F70EB4D2093A40DCFC9204E1D2564056A606E9C1093A40A8C258DCDDD25640BAA04882C0093A40070E4CDBD9D25640ECC2D7BEB9093A4030AE1E68D8D2564015BA6C6AB3093A40980A43AED5D25640149D9D9BA6093A40C3B0987CD4D25640B189CB62A1093A4056063ACDD3D256401E1780299F093A40581AA961D2D2564008A52B979C093A40235ECEACCFD256401A5E9F5B96093A406484A2F0CCD256406B71D90D8C093A40E5B1CA3DCFD256402440688B7E093A40062D8E31C6D25640BF9E681265093A4064AC9A5AC7D256407B5A8FAE4F093A4027903677C9D256406AFFE0C02E093A40B9CEEBD5C4D25640AC27DF362A093A4096CBD7F9C1D2564052717F4A5A093A405F1148CBB6D25640233C2CF45B093A4062903372B1D25640E6719E5685093A40B8C41363A9D256400F4775E585093A4075F8F44594D2564034ABE6F27E093A40B8BBCE3996D25640C8809DFF89093A4027AAB2BC95D25640FBB2C25099093A401DFB052E90D25640941921CF9C093A40DC4EF2418FD25640A9310E5094093A40C5555A4E81D2564041E5993795093A40FF54B2687FD25640C76E8085C2093A4011F88A219BD2564053DF2BE5C2093A40B88BBE5699D2564000A40F32EB093A4077EA745AA7D25640E81B2BDEF0093A40951C674BA5D256400356B4081B0A3A4043DE20D8ACD25640F01C6BA2170A3A406B8EC9F1ACD2564018AAE6E1130A3A40D162871EB6D25640974B7C87140A3A40	2026-09-17 07:19:19.596391+00
6	\N	Dhing_Gaon_inner_Boundary Industrial Area	109.56	11.76	27.44	10.00	5.00	t	t	\N	\N	0103000020E6100000010000008A000000B9759E92C81D5740572C22F0917C3A40F8CCA9EDD11D5740F3EC195C8E7C3A40FFE54AF9D21D574031FFA19C837C3A4090358D20D61D57401C79B5A8837C3A40BA8C1635D81D5740CB54675C777C3A40CB07ACD5DA1D57400B7AB222687C3A406C2607B3E31D5740D5607097077C3A408589A5C7E31D57405BFE41DF067C3A40C980EF6CDC1D574046D49594FD7B3A40B62CF13CD61D5740BF66537CF47B3A40218A0276D11D574038A6D826EE7B3A4090F78AAACF1D574070D044B6EE7B3A40D34CF0E6CE1D5740378AA23EF17B3A40E0AFB177CE1D57404673EF70F37B3A40DC8A8D2FCD1D5740787A618D037C3A409CD939C8CB1D5740FE7E0749157C3A40AA476B88C91D57409C65111E307C3A40ED9DD63BC81D5740650511C2417C3A4092873F17C61D57408A15A6E65A7C3A407455C7F8C31D5740CF8846EC757C3A4052ED6717C21D574033DD24A98D7C3A40F9027855C11D57403D26924E8E7C3A40A2DF1211BF1D574007C00FCB8C7C3A4083A2BDD6BC1D5740F3DDDD6C897C3A40EDFE139DBA1D5740340FA110867C3A40B1F87FE6B71D5740BBEFEA85817C3A40122AD14BB51D5740B2BB85C97C7C3A40EAA328A3B21D57406E85033F787C3A4011E99C57B01D57406EC4FD25747C3A40CE13390DAF1D5740BE0B20A46E7C3A408C9B692BAF1D5740C56A81046E7C3A4046EB8EC4B01D574017E932735B7C3A4096436BA1B31D5740191795C43C7C3A407EA7E745B61D57401D394F6E207C3A403DDB93DEB71D57404921C96D0F7C3A40814A71AFB91D5740F93F35ABFC7B3A4089E1B6A7BC1D5740238BAF5BDF7B3A4044333DE6BC1D5740ABA635B6DC7B3A40CECBE760BA1D5740DF71FE8ED77B3A40BC48AEB7B71D574077677AF9D47B3A400686E53FB61D5740E989D6F3D47B3A40670A7E51B51D5740F32E5801DB7B3A40D5F12E8FB31D574081F70A9DEB7B3A40459A8C5AB21D5740688C96D0F37B3A40ED18A4A3B11D57408B883975FA7B3A407E20D1C1B01D57402DF23403057C3A40D758FBC3AF1D574016F51027107C3A40F06D9161AF1D5740C0914779137C3A404D94CF66AE1D57400414E93D147C3A4076EC5456AC1D57405EEB45D7127C3A40D0F3BFF8A81D5740C3D7084A0E7C3A40C2F74867A21D574070FB4462057C3A40FF8E9C3BA01D574079161ED4017C3A40854551879F1D5740274C4FAAFF7B3A40F744C0509F1D5740161099F1FB7B3A40C8910AA2A01D57401BDF1901F17B3A40597A298FA21D5740FA4845E0DC7B3A40F88E58D3A31D5740AF682E32CF7B3A40D4E59A8AA41D57405902F560C77B3A4014F2A07BA51D574035C70485B87B3A40E10288B2A61D57402F03A2AFA87B3A4086368C30A71D574026E03B26A67B3A404D99ADD7A71D57408B338CC4A57B3A409F99D3DFA81D5740AD3004C3A67B3A40859654F8AB1D57405231528CA97B3A407D768734B01D57404198FF4EAE7B3A40F58331A0B31D574063952346B27B3A4042B5A19CB61D57405AF367D7B57B3A403523AF05B81D5740ABD5379AB87B3A40312D6212B81D5740ACA87FB6BC7B3A40FC18605AB71D5740FF070313C77B3A401996CEB0B61D57405A83D8ACCF7B3A404EBA5B51B81D57407308CA06D37B3A40C866EFB4BA1D574013E25BCDD57B3A403525CE53BD1D574022820513D87B3A402FD284B3BD1D57409D1AEE05D47B3A4052DA7CC8C01D57401FC256C7B37B3A40AA90D56EC21D574092C6688FA37B3A40AC3047DFC21D5740961F34D99F7B3A40EED0714CC41D57409ECD00B7947B3A40718B861DC61D5740A0CC042C817B3A40514D7B53C71D57404F4E3178747B3A409191C9EBC81D5740D8033FA4647B3A40B0651030CA1D5740D896EF91567B3A4064145049CB1D5740D39F2BCD4C7B3A4085BC9D00CC1D5740E171D5C9447B3A40DA3633C5CC1D57408367CAED3E7B3A400E19BE36CF1D57405EBE7282417B3A404900CAF5D21D5740B11DFDDE457B3A406D4652C4D81D5740CB98CCF54E7B3A40680DACCEDB1D574028BF3987527B3A40B744CA7ADD1D57401E297A17497B3A40AB71F09ADE1D5740BCE07EC83A7B3A40A02E6720E01D57409C891DB9287B3A40C26CCC3CE21D5740F3A9E98E147B3A4053FC3D9DE41D57405FC6922BFC7A3A40A5915E47E51D5740ECAFBC9CF17A3A40A1D6A959E51D574015294336EC7A3A40F60B8901E31D5740510B646BE87A3A407AF9252ADC1D574024D267CDE07A3A40D68796E8D51D574006147AD6DA7A3A401180B70AD31D574047EFD381D77A3A40886BCC16D11D5740B5E66FB8D37A3A400496D7B8CF1D5740EFE3E21DD17A3A4057CE4B4BCE1D5740D49A30C1CA7A3A404BD12AE8CA1D57400E57F03DC67A3A400C4D40F4C81D5740178D8A74C27A3A40788479FBC71D57402C1DD491BC7A3A40F44AEB45C71D5740AAD86747B57A3A409943E825C71D5740796B8994B07A3A40D51AA86AC71D574057B53802AA7A3A40224A416CC71D57406C687F9BA47A3A401A1D4EAAC51D5740BDAD154BA17A3A403054915EC41D5740768142F4A07A3A400B94AA6DC71D57409265A9F7EC7A3A409AFBAD33C71D5740FD69C6CAF47A3A405C0177BAC41D5740FEE3F88D157B3A40B7067598901D5740EE010C01537B3A40F3E349B5881D57405B0EBB3F4D7B3A405CAE0C18821D5740F41F95A59A7B3A402A78DCC2811D574087802947A07B3A40AAC10067821D5740074E89EAA97B3A40F37E3EAD861D57404B34C9FCC47B3A4077B08C44931D574096BD0D8AFD7B3A40F6BE86C9A21D5740082EE0B53C7C3A4052B5F7B2A81D5740371B9F67527C3A401736B7F1AD1D57408D8D187F747C3A407CA9BCD8AF1D5740D0F02655797C3A409B7FD11CB01D5740FFB238027A7C3A403147A8F9B21D57403105BBF0807C3A40E9A7029FB51D5740C5AE153E877C3A40E5D38071B71D5740A7BD132F8B7C3A4056810A7CB91D574070B445E08D7C3A402F1C06BEBC1D574037E5B1AE917C3A40F0787CD4BD1D5740CC27663A927C3A40CC834E46C01D574012CA5E74937C3A400E8C4591C11D5740B4AA691A947C3A40B9759E92C81D5740572C22F0917C3A40	2026-09-17 07:20:17.859196+00
7	\N	Dolai_gaon_part_3_inner_boundary Industrial Area	13.08	0.00	0.00	10.00	5.00	t	t	\N	\N	0103000020E61000000100000028000000A9E7447724A25640AF3CE8D1B17A3A4002C4D4D525A2564016ADFD02CE7A3A402AD2889828A25640649464A1F27A3A406B6631E21AA25640D1628C10017B3A40AD5A671D1CA25640261029990F7B3A40CF5DE1141DA25640E414F32B147B3A40D44384251EA25640659EE5E0197B3A4082FF7A881EA256402BF40DC01A7B3A40F54484782EA256407B70FBAD107B3A405B235B2733A256403F4DBAFF0D7B3A40247C33C634A256404BB21E5C0D7B3A4033FC4B9036A256404B83A0620A7B3A4016DE2D7E3AA25640F4556689F87A3A40A7430F463EA256404BE5FA2CE57A3A408DF3C5A042A25640C57CB2DAD17A3A40461C620C44A2564009C320B9CA7A3A400663A23044A256406EC975AFB47A3A4006B51F1D41A2564025203597AF7A3A40C8017AA53FA25640F630C4DDB07A3A4050EE3BD23BA2564042E89E5CB77A3A40CF83B10638A25640A49253BCBE7A3A40288C381E39A256403E935938D67A3A40FCCBBA1238A25640E03A0186D67A3A40FE85EF2937A25640C3C606EFC37A3A40B5A5E26836A2564004BFF0E0C17A3A40992C075C35A25640084EDF2EC37A3A409B762B7230A256406736329BCB7A3A409CA46DE129A256405352884BD77A3A4069841CAC27A25640F5C7067CC07A3A404A68582927A256406730D2EFB77A3A402DE0BBD226A25640DEDDC2A6AF7A3A4059D4879727A2564034A3AA71A87A3A40499D582F2AA25640008C45B9977A3A404FC8DA482EA25640015665AC7E7A3A4036EA1FEF2BA25640785E44617A7A3A40CF7AA7E529A256405350E98A897A3A40CDE8FCD228A25640D7DB041A8F7A3A4059AF17AE27A2564009836057937A3A40E9BB29EC22A256407399AD1F9F7A3A40A9E7447724A25640AF3CE8D1B17A3A40	2026-09-17 07:21:04.873902+00
8	\N	Nakhola_Grant_inner_boundary Industrial Area	178.18	0.00	0.00	10.00	5.00	t	t	\N	\N	0103000020E610000001000000EE000000E1F6F3D2420E5740C3B4845C46203A409EC3876E420E574003794D3C42203A4058A5D245410E5740D3CD482A3B203A4006A0175F400E5740D10B729237203A40193C90D23F0E57404003F9C339203A40529D30213D0E5740B7CD8B863C203A407EF87810330E5740E350DA1040203A40946579372A0E574002FCB97041203A40110596B7230E5740F65479CB3E203A40A37DA5A3230E5740FB374F7839203A402CD83CF0240E57407986FB6F3A203A401DDBF224280E574026FF86123C203A405BCABAD42A0E5740A0A8DF113D203A409EE66A8E300E5740214EE5F03B203A404E6F161B380E57404D2105F938203A40C9BFDA2E3C0E574031C3101F38203A40E5ECA2BF3D0E57400737445635203A40D1AD8AAA3F0E57405177CD6D2F203A408E5C1E3C410E57400BAE0DC42A203A40ED8239A2420E5740C7673DE823203A40010E51D1440E574075F94F3F1A203A4038E5C29B450E5740902B760014203A40E5AD9794460E574019C8321009203A40BC762C1C470E5740C9143A7003203A4063FE9AE8470E57409170017FF81F3A40A78117F9480E574056637B1DEA1F3A40E7AC85C5490E57401D83422CDF1F3A409316AF844B0E57406BC609B2D71F3A402FCE8A444F0E5740E1184A40CB1F3A40F9F70A3C500E574096DD9971C31F3A402F761828500E574056DF6F1EBE1F3A4080176BA54F0E57406EC89028B81F3A4019236A714E0E5740F02B8D8EB11F3A407775F6814B0E57402A2A56AAA91F3A40AD48DCEA490E57400A22382DA11F3A4074E6FF0A480E574017EA023EA71F3A404915378F450E57409B4C158CAE1F3A405B2C083F430E574057BC0EBCB71F3A40EB931E33420E5740C0FF2050BB1F3A40589193AD400E5740796003C9BD1F3A40D4095C3F3F0E57405B5B0899BD1F3A402CA54D093E0E5740B27275D9BB1F3A4012FF2C163D0E57404426ED52B91F3A405C7C8ECC3A0E5740E49E1203B31F3A40F1440F113A0E5740D82D942DB01F3A40702AB2FD380E574052FA0F25AB1F3A405501A370370E574042A46F29A51F3A4015C08CC1350E57401A6CF5E5A01F3A409289CC53340E5740452B6B9D9F1F3A4085C6F206330E5740321412469F1F3A4067814E4A310E574047C445CDA01F3A40FCFE803F2F0E5740AE02596BA31F3A40930478132D0E574081679FE0A51F3A402798C71E2A0E574076E59A5AAA1F3A4010210D8E270E5740A9E9A9AEAE1F3A400D145729260E5740F988CD40B21F3A40B82644CE240E5740681CEB44B91F3A40B693E87E240E57404482362DBD1F3A40730E5DE3220E5740204A5C2DBF1F3A40D4A41FA2200E57406F80F548BF1F3A40EAC5B3C1160E57409EB686BFB91F3A40FF6FA9B3030E5740967FF6DEAB1F3A404BE1E176F20D5740108F7739A01F3A40478C8476DC0D5740B7E0B957911F3A40A5E65D74DC0D57406664905F621F3A40FBF0B7A9DC0D574096B6F3654D1F3A40F1C060A1DD0D5740B9D32747451F3A4055F0ACF9DF0D57407EFB1323431F3A4008231323E40D5740E0E6638A431F3A402C1266D1E80D57402B4DE794441F3A4033D5A0BFFB0D574057F2B7B5341F3A40BE31C12CFC0D57400319561A391F3A400820BD1CE80D57404981ADC44B1F3A40C9EC7736E40D57404523301E4A1F3A4093991E01E10D57409033570C4A1F3A405B7EDFB3DF0D5740C36F6BA54A1F3A40015426D4DE0D574076ABA5B24E1F3A4019A77411DE0D57406B84FEC2761F3A403736194BDE0D574020CA04BF8B1F3A40207D078CE40D57400E300128901F3A40C84E7F70E60D5740EFBB039B841F3A4048603EC4E70D574006A11F1D7F1F3A4056F7E136EA0D57404EBC9F44731F3A40141C4950EA0D5740FE2051C16B1F3A40BC54C3FBE90D5740D21956BA611F3A4053858B1BEB0D5740A8F08CA1631F3A405F5FCE5CEB0D57404F5593C4661F3A40E8D77787EB0D5740A99297D76A1F3A405652B863EC0D5740CEFA76EE6E1F3A404786278EEE0D5740A238253B701F3A402BD81932F20D5740EB61DB3F711F3A403548DA7CF50D5740D51F1C33731F3A4030A011F3F80D5740A22B6D58771F3A40965CF2D6FC0D5740BE51B9A17E1F3A401796C8FFFE0D5740A9B848B0831F3A40D41BAEC2010E57404E32CAE38B1F3A406CFA9442040E5740E3A05206951F3A4005B6AD32070E57403346D6599B1F3A40BF2825BB0C0E57407C05AB7DA51F3A401462D5B4100E57407828E3B7AD1F3A40030717A8110E5740579E47EEAF1F3A40C921652A140E5740F416F46DB31F3A40B2585C1C170E5740BFAD3C5FB51F3A40BEDD61021B0E5740CE3BF5A5B71F3A4084F135631E0E5740BDA0CAE9B91F3A40A98BC66B210E5740C47F11EBBA1F3A40F860E23E230E57401DF00AC4B81F3A40119BA9A3240E57409F91D309B51F3A408A3A92C7250E5740BBD11D3CAD1F3A40F889000B280E5740A822E8F5A71F3A40336B6A9B2B0E574090C6E3B6A21F3A4082FB3521300E57403748B8AB9A1F3A40502C4ED2320E574036E27989981F3A401D020007360E57408E11002C9A1F3A40709FDAEC370E57405D528B29A01F3A40EF4A71823A0E5740DE84218DAA1F3A40223DA1023D0E574080BE490FB31F3A40756337573F0E5740397689AFB91F3A4094E0CAFD400E57402E10B0D7B71F3A4058F566F4430E57401AA062D3AE1F3A40B9F40473490E574034D8E6D79B1F3A40BD3D13AE4C0E574005A4CF728E1F3A404E91360D550E5740EFEE5722721F3A4069B1E5555F0E5740745DEE0A531F3A409FFACEC36E0E5740219C9D36221F3A40310CCD92770E5740C75D4BB7031F3A405CE90C77800E57405C358569E71E3A40AB6051E0850E5740FE144D3CD21E3A40596624E4850E5740C76CB727C91E3A40AE1084E6850E574042F1DE84C31E3A40C2CAEC6E850E574058462691B71E3A40B25B8E9E800E5740F66BDA51A81E3A40BD44F57F6D0E574013F37EE0971E3A40BB57528B620E574051FB85CDA91E3A408878A42D530E5740F7FF0BD9A91E3A400069003D520E5740603DF5F4AB1E3A40AA930AC9510E574097931A33AD1E3A40223CB3B6510E5740B3A96A93AE1E3A402581D6BE510E5740BE2E7E54B01E3A40B0041CA4530E5740CD207DADCC1E3A40DADAB487520E5740B965AF47CD1E3A4068B3860F530E5740D03C3412DC1E3A401C3A7D53530E574009756657E31E3A4017DE6E11540E5740900B0E22F01E3A405B0B9777540E574040959889FA1E3A40DC2B302B550E57407B37762C081F3A4016AE35FC540E5740B64E96460E1F3A40A6DBB18B540E57407D9C03DE111F3A402D7627A1530E5740E082BB4A151F3A40388E743C520E5740B04FE6DC181F3A40509C4E25500E57409D6D44741E1F3A4048D924AA4E0E57402F2045A6221F3A401746C3714C0E57409474D614281F3A40C1E20F234B0E5740153FB71F2C1F3A401AC238174A0E57408467B68B2F1F3A40126D3559490E57408BB839A9321F3A407876FA6F470E5740D78DB9A7341F3A40884DB5BE450E57405ABCDD8E351F3A4033238D3A430E57404E607571361F3A404E6135B6410E57408B1DEC18361F3A40E6B800783D0E5740B228A467321F3A408C9E037B3A0E57404BC6164E301F3A40A45985F7370E5740E10DE19F2F1F3A404B172974350E57403A3182A12E1F3A403CC4D1C3330E574022E587572D1F3A40A28B2AD0320E57404F5BA0112C1F3A40DCAB3FB0310E57400FD69A7A2A1F3A40B4DF187F2A0E5740B0AC3931271F3A40B1A6A15F280E5740CFBCFF34261F3A40FB881BBB250E5740B9DCBBE5241F3A407F0EA14D240E57403652DEFC221F3A409DCF0DEA220E5740EBEDA9E5231F3A40D8B43670210E5740B8A90EF6241F3A40402B0BB41F0E57407899B164251F3A404090ACF71D0E5740D0DA904B261F3A405A47EF5C1C0E57402913C36A261F3A400C4DB8311B0E574083F7B94B251F3A406408ACFB190E5740455D228C231F3A4066B305DC180E5740F0E8C854211F3A40A0100B7A170E5740AF88AD7B1E1F3A40CF967570160E57400D31F7941C1F3A40B7182C9E150E5740E8DCB0271B1F3A40FB11103B140E57401AB0ECF71A1F3A40F08B1504130E574021336F691B1F3A40730BC847110E5740BCCC37281C1F3A40B5087D120D0E574024E6B1A11D1F3A40FE1FBFBD070E5740E5D1916B1C1F3A40A980EF73040E57402CEA3C47181F3A40471A8632030E57408291B527171F3A400D93786A020E5740D6E1B1C3171F3A40E041B7C3010E57409AE66660181F3A404B796D1C010E57408495BD3D1A1F3A40F1C29C1B000E574004C905D21D1F3A400AD15EB6FE0D5740CC21C5A4221F3A40A74CEE24FD0D5740292851FE261F3A406C7D63B5FB0D5740B9D7DFEF291F3A40CA9B467EFA0D5740217387B12A1F3A4019A8CEA0F80D574087F5691F2B1F3A4030CA80E4F60D5740F06F2DDE2B1F3A40325570C4F40D574020479D4A2C1F3A40BFB53DA4F20D5740DE0935072D1F3A402382A88EEF0D5740D233EB8F301F3A40FE3F09AFEC0D57403B99A5B3371F3A4067A1D31FE90D57407A6725213A1F3A40A8DF8084E80D5740263AB1F5391F3A4065475C16E70D5740F526949D391F3A4064E4EB70E50D5740B29505CC381F3A406A0B7551E30D57407D66BBCF371F3A402AF344ADE00D5740E542FEB7351F3A40836EBF08DE0D57408965A568341F3A408EF007FEDC0D5740720C402B351F3A40B5616840DC0D57406ADC4058371F3A4061AA25BADB0D5740F0E69ED6391F3A4048B62707DB0D5740F6D56A1C3D1F3A40F9E28F6ADA0D5740BCA675EA3F1F3A404D556E10DA0D5740178A1B0A431F3A409271A10EDA0D57409784110A431F3A406C0AD07DD90D574057B46FCB591F3A40D7F9CEBBD90D57400A34FA2C5A1F3A4047568049D90D5740D800D1536C1F3A404E21CE03CA0D5740E24B5A975D1F3A4005B48E95C90D5740B2AF6339661F3A4047A021C0CB0D57405DE49D8E891F3A401C8343A6D20D5740F5F8BC77961F3A401EF9D01CDC0D5740463750EEA91F3A40D8542C43E20D5740DCDD5535BB1F3A4018145A1CE70D57400D6758EDCC1F3A40E3A785FDEC0D5740CFA7F84DE41F3A406D426919F20D57403E5A49CBF51F3A4069E03E50F80D57401F8ED98A07203A4005F5BA5DFF0D574098AB38891D203A40C341C26F080E5740555348A232203A404C887427100E5740A88CD4F33F203A4082BC097A1A0E5740E3BFB2364B203A408D083004220E5740564BE5314E203A40B7A4A1142A0E5740EDF0A49A4E203A40A130B3633B0E5740B24E909349203A40E1F6F3D2420E5740C3B4845C46203A40	2026-09-17 07:22:26.352069+00
9	\N	Naltali_inner_boundary Industrial Area	9.71	0.00	0.00	10.00	5.00	t	t	\N	\N	0103000020E610000001000000310000000C3E9FC245385740C0C84A70D68F3A40C49FA89648385740804704BEC78F3A400489360649385740405564C9C58F3A40D0AE48094B385740608423B5C98F3A4098870F474F385740A0866AB9D28F3A4014D8CCA0533857404054FA2CDA8F3A406C25971B57385740B08D9530E38F3A4014205C4C5C385740E0D2F60AEF8F3A403C75CF9C5D385740D08285E7E98F3A402074CD665F385740B020C2BBE08F3A40A08BC9295E38574020329927DA8F3A4040822A935A385740907FB5BFD08F3A40B8A2927157385740506BF7DFC68F3A401C1677185538574090D97E2DBE8F3A409CE230A953385740901B03D5B78F3A4008DE418251385740603977AAAE8F3A40D4EE33CA4D385740A04B907EA58F3A40D41735874A38574020FA91629B8F3A40182B31B94738574010AB1683918F3A40EC17599D463857401042F6478D8F3A40F8E4CEC746385740800D317F8B8F3A40E8FD1F5B4738574060BBDCED878F3A409088516B48385740205D501C838F3A40D49AB10E4A385740F00576BA7C8F3A40189F7B424B38574060177BC9788F3A4084857F744D385740D076F217728F3A40687A6AF34C38574090663A966F8F3A406C8B72F24A385740004CC4F7758F3A40BC2D64D949385740D0C2E6087A8F3A4058824303493857404042AFF97C8F3A40485D896B48385740908AA5DA7F8F3A409C2AB72E47385740502E7E8C858F3A4074670A8E463857401045AEED888F3A40343DAB0C46385740302E2CBE8A8F3A40D4B9399D45385740208AF40D8B8F3A4098D7702045385740E0D077ED8A8F3A4040321E4F4438574000779AAB888F3A4020A150C74238574080C831A7828F3A40D89C2CB14038574020D62670788F3A40C81ACCA73E3857406015FDA3708F3A40D4BBF6A93D385740607E89896D8F3A400029032B3D385740106093806C8F3A40C023CC793A385740E0C8FDCA758F3A400C54EC4038385740D031C4FD7E8F3A401C24FA4A3638574020C23010878F3A40A4E48FE134385740D0E508128D8F3A4070B989DD3938574020796ACD9A8F3A40E46CEBF83638574000E0F676AE8F3A400C3E9FC245385740C0C84A70D68F3A40	2026-09-17 07:23:21.200887+00
10	\N	Namali_Jalah_inner_boundary Industrial Area	85.27	40.85	21.78	10.00	5.00	t	t	\N	\N	0103000020E61000000100000005000000AF97C89DDBB05640F34983DE91783A40C8346A05D2B05640FD1B80C08F783A40990CCC9DD2B05640AE62DC90B2783A409B6851BEDBB056408AC83CF1B2783A40AF97C89DDBB05640F34983DE91783A40	2026-09-17 07:27:11.942201+00
11	\N	No_1_Nowpara_inner_boundary Industrial Area	85.27	40.85	21.78	10.00	5.00	t	t	\N	\N	0103000020E61000000100000005000000AF97C89DDBB05640F34983DE91783A40C8346A05D2B05640FD1B80C08F783A40990CCC9DD2B05640AE62DC90B2783A409B6851BEDBB056408AC83CF1B2783A40AF97C89DDBB05640F34983DE91783A40	2026-09-17 07:29:30.358958+00
13	\N	Paschim_Jalukbari_inner_boundary Industrial Area	13.64	0.51	0.00	10.00	5.00	t	t	\N	\N	0103000020E61000000100000036000000A808105A0AE9564030E2F185B6243A40346717DA0BE9564090C6B1E8AE243A40F48E66A60CE9564070DF73D5A8243A40CCB20E990CE956408020CB5EA4243A407C1AA9BD0CE9564030C404EA9F243A409CB56E080DE9564020BA81E394243A40C06F959C0DE95640107C56B780243A40782B680B08E95640903F419577243A40E4B7DDD106E9564060A29BC773243A404058229808E95640A01CCBF656243A405C67254709E956408048D67B4B243A40E44E601909E95640100663D745243A40B034593002E9564090E224B93B243A40D81CA090FFE85640304F36904B243A407073EB73FDE856402010323B4A243A406C31B033FDE856403033E9FF58243A4058311B4EFDE85640B094D64665243A4058936B91FDE8564000C987437F243A40FCD9963AFBE85640A0ED94787E243A409873B79AFBE8564050D3D01B6D243A40447E80CDF6E85640F01C962B69243A40D0540F74F5E85640A078D17B63243A40909B748AF5E85640C094EBBC5B243A401CA1C888F5E8564030B5198B47243A40E019EB8BF5E85640B03A2D5143243A4088BD23A2F5E85640E0A862CE3B243A40C838342CF6E85640402D6C4035243A40B098C314F7E85640C09EA75028243A4024AC3AF3EEE856403073E5E119243A4074D5DBD1ECE85640F0495A4041243A402C4F2EB1EBE85640A07AF7435F243A401C998217EBE856403003A86864243A40349AD8A1EAE8564080F0C7577C243A4050DF1BEAE9E85640507F119093243A40A8FD6484E9E85640509A3F70AC243A4008556DFEE8E85640D05C87E6C3243A4014492912E9E8564060F6A6D0C6243A40602B8A45EAE856402022C79DC6243A4090039284EBE8564090A03D82C7243A40D480F0ADEDE85640C061BDBEC6243A40289ABA44EFE85640F0ABBE0DC6243A4068C25DFAF1E85640203744BFC4243A40C4B59B1EF4E85640904991EAC1243A40C45E5EFDF4E85640A09C07E9BD243A4024A059E0F5E8564080363D31BD243A409C56A09DFBE85640E087FFC5B7243A40D80EC0F9FEE856404045CA7DB6243A40EC4EF2C201E9564070B74DC0B5243A4040A569DF03E9564010B2056CB4243A40F026CCE105E95640E0416456B2243A40ECD5422F07E956405079A8BAB1243A40908A238908E956404074FB57B2243A40E8FDD08B09E95640807C6CCAB3243A40A808105A0AE9564030E2F185B6243A40	2026-09-17 07:36:55.994293+00
14	\N	Sarusajai_inner_boundary Industrial Area	32.60	0.00	0.00	10.00	5.00	t	t	\N	\N	0103000020E6100000010000001C00000061D2AE4F54F05640D17A74E2291D3A400FBF07E954F05640B404CD50261D3A408E52D6275BF056407C006647251D3A40212F2A0C65F05640FE0C3355221D3A40C46C9C6367F056400F78BB19221D3A40EFAAF0B96BF056408AE5944F211D3A40215560B671F05640B399ACF31F1D3A40BB7A380572F05640B71F8C3D1E1D3A406A87F2BC71F05640EEA0213F161D3A402CF7CA2F71F05640D858F43F011D3A40C8A4F2F770F05640EA412EFEE01C3A40740C051271F056409B83277CBA1C3A406253DB1A71F05640233E3BC29E1C3A40214488E344F056400B5F0C08A31C3A409680B01F30F05640613331F0A21C3A40B64127A032F0564064BDDEA5C11C3A403C5EBFDE32F05640AF53EB86C71C3A409EA1E8D832F056408A1DFBA2E81C3A40A008112F33F05640A68BE1D7FC1C3A400799A3B733F056402AD52D5A101D3A40BB0F8FE233F05640EC1DBDB01A1D3A4058F31D4B34F05640AF9401512C1D3A40FA55146134F056408CD16D3F2F1D3A406F9645D334F056402907C1BE2E1D3A40A26D5AEC3DF0564053E63AF0301D3A400AB9AC5944F05640DACDF5C62C1D3A40C49FD72A48F05640360A46F82B1D3A4061D2AE4F54F05640D17A74E2291D3A40	2026-09-17 07:38:11.234486+00
15	\N	No_2_Japorigog_inner_boundary Industrial Area	8.24	0.00	1.61	10.00	5.00	t	t	\N	\N	0103000020E61000000100000005000000010F941B85F15640EB5AEE69C0283A4042F1426494F15640FB268DB7C1283A403817CFA994F1564074F97A3198283A40659B256185F156402266DDE396283A40010F941B85F15640EB5AEE69C0283A40	2026-09-19 09:55:27.569333+00
\.


--
-- Data for Name: infrastructure_layers; Type: TABLE DATA; Schema: public; Owner: gis_admin
--

COPY public.infrastructure_layers (id, name, infra_type, attributes, geom, created_at) FROM stdin;
\.


--
-- Data for Name: integration_adapters; Type: TABLE DATA; Schema: public; Owner: gis_admin
--

COPY public.integration_adapters (id, system_name, endpoint_url, auth_config, is_enabled, sync_interval_seconds, last_sync_status, last_sync_at) FROM stdin;
1	DPIIT National Land Bank	https://nlbp.dpiit.gov.in/api/v1/sync	{}	f	3600	\N	\N
2	Single Window Clearance Gateway	https://eodb.assam.gov.in/api/v1/land	{}	f	3600	\N	\N
\.


--
-- Data for Name: land_parcels; Type: TABLE DATA; Schema: public; Owner: gis_admin
--

COPY public.land_parcels (id, estate_id, parcel_id, plot_number, survey_number, village_id, area_acres, availability_status, land_classification, ownership_details, infrastructure_details, photo_urls, geom, created_at) FROM stdin;
4	3	LP-BOND-001	Bonda	\N	\N	9.10	Occupied	General	Government Land Bank	{}	{}	0103000020E6100000010000001F00000045393BFAF1F55640BC8A52911F2F3A401D7AA23CF1F5564035009A00E42E3A40446D9D4EE7F55640434FB5FABA2E3A401B2EE267E0F55640291B82ACCC2E3A40B1B29B69DEF55640C948D1C8D12E3A4068619F06DBF556403317EDD9DB2E3A401980A353DAF556402F3A2266DC2E3A40F07D5FE2DAF5564084883AEDDF2E3A40EA14DCB3DBF55640FC73224DE22E3A40AB285F86DAF556405B77BDECE42E3A40708762A9D9F556402BCDC52CE32E3A403A8118AAD8F55640492B79FCE22E3A40CD1A88CCD6F556407C302B15E32E3A4048694EC4D0F55640CBAFB2ACF52E3A4008BD5C31D1F55640AE16C2D1F82E3A400C366E39D5F5564017B4216C0B2F3A403A24C8E0D5F55640E771E7300A2F3A40625D47C8D6F556406CE9ACE10C2F3A40D01B2CB0D7F55640C36326F20E2F3A40D7C2D103DAF5564043586D48152F3A40415C825EDCF55640FA4B190A222F3A40C91E4586E4F556402DC97A0E452F3A4002041251EAF556401CE0E1EA5E2F3A40B81ABBC4EFF556405243271B762F3A405E428B67F5F556407C7371D9652F3A40765A5BC7F8F5564073C5673B5A2F3A409F7703E8F4F55640334432384B2F3A4084A55AA7F5F55640F9E4562C472F3A400F065C0FF9F556404767ECF2362F3A40793EFC1EF4F55640D814AB0B212F3A4045393BFAF1F55640BC8A52911F2F3A40	2026-09-17 06:45:21.407295+00
3	2	LP-AMER-001	Amerigog	\N	\N	10.36	Vacan	General	Government Land Bank	{}	{}	0103000020E610000001000000220000002F53445BB0F856405E3FDC49981B3A40717284ACB3F85640050744AF8E1B3A406B42B03DB7F856406F00D478891B3A40E1FB54A1BAF85640176EEA21861B3A40F4D67DAABDF856401E0A9C99851B3A4034C5A1E1D8F8564071B854E4AD1B3A40D9748218DCF856404D224D2CAB1B3A407929BAFBDEF85640C71378FD9F1B3A400C2372B1DFF85640524BA21F991B3A4004BD2E28E0F856408E5AE34C8C1B3A405B7CB7EADFF85640A635C6D6831B3A40F784BA04DEF856405474EA05801B3A40C1BCE61EDEF85640FF007173791B3A40F47BFA71D0F856404EFF7D004B1B3A409EBFFDABC6F85640B64B265C1C1B3A4004C7F3CCC3F8564026E9A4A7201B3A402974F98AC1F856409F369426221B3A4095A0CC1CBFF856409484FD53231B3A402E1362E4BDF856400F65BF1B261B3A4028F536D7BCF85640BD0BC7C52A1B3A40FDC718C9BBF85640CA088F00311B3A4023278EE7BAF85640B5668FEC361B3A408C5EF71CBAF856402735A5983B1B3A40FD1F0D32B8F85640A591AAEB3F1B3A400ACA59ACB5F856401C236F49431B3A4025435AB6B2F85640517BD2D4481B3A401B2996C8B0F85640DC8617DA511B3A400611765EAFF85640BCC0AD645D1B3A4098644F8FAEF85640441C5E94691B3A40A9323801AEF8564087275147781B3A40E0EB0CF9ADF85640BF06C8BD851B3A405AF2468FAEF85640F593A4368E1B3A40ECE52928AFF85640A44D664D921B3A402F53445BB0F856405E3FDC49981B3A40	2026-09-17 06:23:47.469352+00
6	3	LP-BOND-003	Bonda	\N	\N	3.84	Vacan	General	Government Land Bank	{}	{}	0103000020E6100000010000002B0000003CE48D9ED2F55640E044802FE62E3A40C4BD6031D6F5564040545029DC2E3A40C830B65FD3F55640B070749FC82E3A40F0596733CDF55640801EFD4AC52E3A405C726FA6C2F55640109F9225BC2E3A40BC036E16C2F5564000F5FC58C42E3A405022EF8EC0F5564070D368B7DE2E3A40E4407796C3F55640A022C58DE12E3A4018F76BB1C5F5564000A1FB56E52E3A4004D88AE2C6F55640807ACBE9E72E3A40A400D441C7F55640F0C488B7E82E3A4074DDDCAFC7F55640E0EE21EEEA2E3A40D8F36B0FC8F5564040F730DAEC2E3A4088351818C8F55640D0958712F52E3A40D4D1A0E8C7F55640709A8A43FE2E3A40B4F3E79CC7F55640605F073C082F3A40389C4945C7F55640801F96120F2F3A40C015B2ACC5F556405018269C182F3A40300A4068C4F556407025BFC9202F3A40240BB295C3F55640802ACB7A242F3A40B8B9E284C8F55640B0B63E5C3A2F3A40302C475AD3F5564050684CA76A2F3A4024961753D5F55640C00CC0AD732F3A4060B71232D8F5564000EE41F46B2F3A404445096DDAF55640808103AB642F3A40B8DA7E64DBF55640306082B05F2F3A405055AE95DAF5564000099A16592F3A40CCFAA49CD8F55640D008DAF14F2F3A40085EDB1ED6F5564020F06F00462F3A4044597846D2F55640F0075E4E512F3A400C415147CEF55640C003FA25422F3A40F460F524CBF556408071B30D352F3A40C424A48AC7F556406076DA7F242F3A40AC858DB7C7F55640E027EAB8232F3A40B0425958C9F556408045B6611A2F3A40145D018ACAF5564050CC002F112F3A40B0800911CBF5564060BFF6610E2F3A40B03B72A4CCF5564050EE1AA4082F3A404044B0D5CEF5564020E17929FF2E3A40D8FEE968CFF55640006DFAA3FA2E3A40FC6E08C5CEF55640301F9C64F62E3A40E82098C7CFF5564010B6776AF12E3A403CE48D9ED2F55640E044802FE62E3A40	2026-09-17 06:45:21.410672+00
10	3	LP-BOND-007	Bonda	\N	\N	0.51	Vacan	General	Government Land Bank	{}	{}	0103000020E6100000010000000B0000007AD5150AD5F55640A4CD1FDB402F3A40190C9651D1F5564094AC9F252F2F3A402076E52ACCF556404BF26138192F3A404F6F07B7CBF55640B362534E172F3A40F6F93D78CBF556405DCC65C31A2F3A4058AC3474C9F5564043A1DCFE222F3A40C2AAB3FBCBF556409245AF212F2F3A402B9A1649CFF556402B956D6C3E2F3A4001F648FFD1F556404FADF8F6462F3A40DD5CF18ED2F556409B232414482F3A407AD5150AD5F55640A4CD1FDB402F3A40	2026-09-17 06:45:21.41593+00
12	3	LP-BOND-009	Bonda	\N	\N	2.54	Vacan	General	Government Land Bank	{}	{}	0103000020E610000001000000130000008C99C5CBECF55640F0F6C26F912F3A402425F199EBF55640A04A39FC8A2F3A4064731F19E8F5564090CBE51B962F3A404CD47AB9E3F556405037BB75812F3A4078D1F4C2DDF5564010015D7F662F3A4044322BF1DCF55640301CAE97642F3A40ECA2B760DCF5564080111BBB642F3A403C8BFB7ED6F5564070E94B0A792F3A40CC99C7A9DBF5564060977AB0902F3A4098199A5DE2F55640A09CB43CAF2F3A407CD1C7D1E9F556405072A6F0D02F3A40D48AC395EBF55640B027EE95DA2F3A40B48C64DDEBF55640C0E77E12D72F3A4088D21163EBF5564090B787F2D22F3A405C3CAE8FEBF556404077A541CE2F3A40C80C5B0AECF55640907982E0BB2F3A4078F99A33ECF55640A0914D8DA62F3A406CC6C475ECF5564060DB1EBB952F3A408C99C5CBECF55640F0F6C26F912F3A40	2026-09-17 06:45:21.418064+00
5	3	LP-BOND-002	Bonda	\N	\N	2.49	Occupied	General	Government Land Bank	{}	{}	0103000020E61000000400000036000000F07D5FE2DAF55640A0883AEDDF2E3A401880A353DAF55640303A2266DC2E3A4020F68125D8F55640B0B3581BDE2E3A40ECF93B77D6F5564040CB7C0DDE2E3A40C4BD6031D6F5564040545029DC2E3A403CE48D9ED2F55640E044802FE62E3A40E82098C7CFF5564010B6776AF12E3A40FC6E08C5CEF55640601F9C64F62E3A40D8FEE968CFF55640006DFAA3FA2E3A404044B0D5CEF5564020E17929FF2E3A40B03B72A4CCF5564050EE1AA4082F3A409466B238CBF5564050C175D10D2F3A40B0800911CBF5564060BFF6610E2F3A40145D018ACAF5564050CC002F112F3A40380A5B71CAF556408026E6EC112F3A40B0425958C9F55640B045B6611A2F3A40AC858DB7C7F55640E027EAB8232F3A40C424A48AC7F556406076DA7F242F3A40F460F524CBF556408071B30D352F3A400C415147CEF55640C003FA25422F3A4044597846D2F55640F0075E4E512F3A40085EDB1ED6F5564020F06F00462F3A40CCFAA49CD8F55640D008DAF14F2F3A405055AE95DAF5564000099A16592F3A40B8DA7E64DBF55640606082B05F2F3A404445096DDAF55640808103AB642F3A4060B71232D8F5564000EE41F46B2F3A4024961753D5F55640C00CC0AD732F3A403C8BFB7ED6F5564070E94B0A792F3A40ECA2B760DCF5564080111BBB642F3A4044322BF1DCF55640301CAE97642F3A4078D1F4C2DDF5564010015D7F662F3A404CD47AB9E3F556405037BB75812F3A4064731F19E8F55640C0CBE51B962F3A408029CAB7F9F5564090FB15295E2F3A40785A5BC7F8F5564070C5673B5A2F3A4060428B67F5F55640A07371D9652F3A40B81ABBC4EFF556405043271B762F3A4008041251EAF5564050E0E1EA5E2F3A40D01E4586E4F5564030C97A0E452F3A40485C825EDCF55640104C190A222F3A40D8C2D103DAF5564040586D48152F3A40D41B2CB0D7F55640D06326F20E2F3A40605D47C8D6F5564090E9ACE10C2F3A403824C8E0D5F55640E071E7300A2F3A4008366E39D5F5564020B4216C0B2F3A4008BD5C31D1F55640C016C2D1F82E3A4048694EC4D0F55640F0AFB2ACF52E3A40CC1A88CCD6F55640A0302B15E32E3A403C8118AAD8F55640502B79FCE22E3A40748762A9D9F5564060CDC52CE32E3A40AC285F86DAF556405077BDECE42E3A40EC14DCB3DBF556401074224DE22E3A40F07D5FE2DAF55640A0883AEDDF2E3A4007000000280183FDD0F5564070D2E28D042F3A40F04E6357D4F55640903CF1A7112F3A40004E4627D0F55640D043F1ED212F3A40C05C3E9FCFF55640E077F9971F2F3A403CA520C9CCF55640004C51DB142F3A40E0CE0B1ED0F556401098C4B7062F3A40280183FDD0F5564070D2E28D042F3A400B0000002076E52ACCF5564060F26138192F3A40140C9651D1F55640B0AC9F252F2F3A407CD5150AD5F55640C0CD1FDB402F3A40DC5CF18ED2F55640A0232414482F3A4010F648FFD1F5564040ADF8F6462F3A40309A1649CFF5564030956D6C3E2F3A40C4AAB3FBCBF556409045AF212F2F3A4060AC3474C9F5564050A1DCFE222F3A4000FA3D78CBF5564070CC65C31A2F3A40506F07B7CBF55640D062534E172F3A402076E52ACCF5564060F26138192F3A4010000000B0684B19D1F55640E043D115262F3A404C3D3C07D7F55640006390AE122F3A40A040674BDAF5564020B286FF1E2F3A4050735A7CDCF556409014C485272F3A40AC183F9AE0F5564000EA21C13A2F3A408800967AE3F55640F071CAE6462F3A4048AD4799E7F5564090798DE1582F3A4034982284EAF55640304101F8652F3A40847DBA8CEEF556404063F7C9772F3A4038087B4BE8F55640C025E1B88C2F3A40F8DA541DE2F55640E032CFE8712F3A40ACC8E7E0DCF55640C08684325B2F3A405472001AD6F55640F0F785C33D2F3A40507F8161D4F5564070015C4A362F3A40381F7FCFD1F55640002BBE36292F3A40B0684B19D1F55640E043D115262F3A40	2026-09-17 06:45:21.409266+00
7	3	LP-BOND-004	Bonda	\N	\N	2.13	Occupied	General	Government Land Bank	{}	{}	0103000020E6100000010000000F0000008029CAB7F9F5564090FB15295E2F3A40B0F63873FBF55640A030EC0D652F3A4050B9ADB1FCF5564020CDF1BA6A2F3A4008A88201FFF55640D05DCBCC6F2F3A40D4A22C2701F65640A063AC145C2F3A4068EEE8C105F65640A057ACF5312F3A40B0A6914F07F65640C0A364B9232F3A4010F3867706F6564080C8D57C212F3A40901CC95401F65640400078E0132F3A40C0057DCD00F65640A0A9BA25122F3A40C0E1E0D3FEF55640003E1E7A1B2F3A4084A55AA7F5F5564000E5562C472F3A409C7703E8F4F55640204432384B2F3A40785A5BC7F8F5564070C5673B5A2F3A408029CAB7F9F5564090FB15295E2F3A40	2026-09-17 06:45:21.411979+00
8	3	LP-BOND-005	Bonda	\N	\N	2.88	Occupied	General	Government Land Bank	{}	{}	0103000020E6100000010000000F000000B3684B19D1F55640CB43D115262F3A40361F7FCFD1F55640F52ABE36292F3A40517F8161D4F5564050015C4A362F3A40A4C8E7E0DCF55640CF8684325B2F3A40F7DA541DE2F55640F132CFE8712F3A4035087B4BE8F55640BA25E1B88C2F3A40837DBA8CEEF556403663F7C9772F3A4032982284EAF556402B4101F8652F3A4042AD4799E7F556407B798DE1582F3A408900967AE3F55640D571CAE6462F3A40A8183F9AE0F55640F4E921C13A2F3A4055735A7CDCF556409414C485272F3A409840674BDAF5564013B286FF1E2F3A40443D3C07D7F55640E76290AE122F3A40B3684B19D1F55640CB43D115262F3A40	2026-09-17 06:45:21.413162+00
9	3	LP-BOND-006	Bonda	\N	\N	0.28	Occupied	General	Government Land Bank	{}	{}	0103000020E6100000010000000700000033A520C9CCF55640E74B51DB142F3A40C05C3E9FCFF55640E877F9971F2F3A40014E4627D0F556409C43F1ED212F3A40E04E6357D4F55640A63CF1A7112F3A40290183FDD0F5564072D2E28D042F3A40D9CE0B1ED0F556400298C4B7062F3A4033A520C9CCF55640E74B51DB142F3A40	2026-09-17 06:45:21.414666+00
11	3	LP-BOND-008	Bonda	\N	\N	4.53	Occupied	General	Government Land Bank	{}	{}	0103000020E6100000010000000F0000001D7AA23CF1F5564035009A00E42E3A4045393BFAF1F55640BC8A52911F2F3A40793EFC1EF4F55640D814AB0B212F3A400F065C0FF9F556404767ECF2362F3A40B9E1E0D3FEF55640BA3D1E7A1B2F3A40B9057DCD00F6564080A9BA25122F3A408C1CC95401F65640F3FF77E0132F3A4009AB785A01F65640875D34E00A2F3A400BDADC7F01F656402D284EE6062F3A407C3CAEEE02F656402D8A0345F22E3A40BB8F79EF0BF6564088A97B62F12E3A40BD37B93D0CF65640FEDB3463CD2E3A402F82A031FEF5564082EC9FE4CE2E3A409357D4F7F0F556400D0C1419CD2E3A401D7AA23CF1F5564035009A00E42E3A40	2026-09-17 06:45:21.417036+00
13	3	LP-BOND-010	Bonda	\N	\N	1.55	Occupied	General	Government Land Bank	{}	{}	0103000020E6100000010000001300000008A88201FFF55640D05DCBCC6F2F3A4050B9ADB1FCF5564020CDF1BA6A2F3A40B0F63873FBF55640A030EC0D652F3A408029CAB7F9F5564090FB15295E2F3A402425F199EBF55640A04A39FC8A2F3A408C99C5CBECF55640F0F6C26F912F3A409085EF87EEF55640F05C0D7E912F3A40A0E305A4F0F5564070D06484932F3A401C28A82EF3F556404005AD56962F3A40CC719813F5F55640001CF3C4972F3A40F4333EA6F6F55640F062CD9F972F3A4034E2B33AFAF556406065FB26972F3A40D0CD3262FBF556402094D0F9962F3A40D4664B51FBF55640F0832A9F952F3A402071E046FBF5564050F21F24902F3A403C5EBC81FBF55640204F68DD8A2F3A40C4376AB8FCF55640E0493D7D822F3A40F47A95B6FDF5564030FC06AC7B2F3A4008A88201FFF55640D05DCBCC6F2F3A40	2026-09-17 06:45:21.419637+00
19	6	LP-DHIN-002	Plot_1	\N	\N	6.48	Vacan	General	Government Land Bank	{"Id": 0, "Plot_Name": "Plot_1", "Use_Image": "Google earth", "Plot_Vacan": "Vacant"}	{}	0103000020E61000000100000019000000B415EC04B11D574094F21E116D7C3A4077E6B58EB11D5740641594C5717C3A405AF14D3DB31D5740589989BB747C3A4043EADCFBB61D57400D5103DB7A7C3A4092F95D4BBA1D5740A28D51FE7F7C3A4083252EBCBC1D57407C79471E857C3A40C43513F6BE1D574064C11EB2877C3A408AB838F7BF1D5740C9639BD7887C3A40CA4D09FAC01D5740FC492A66847C3A4001FD2AB0C21D5740BB494AEB6D7C3A40F6864F80C51D574088D65E204B7C3A4048F3AAB5C71D5740827703002E7C3A40FF09ABAFCA1D57409E8083D10A7C3A4080FCCC64CC1D5740B1624EAAF77B3A40ACEED4C8CC1D5740434853DDEE7B3A400F084076CC1D5740391C7FBAEB7B3A4076D467D5CA1D5740E87F0F5BE97B3A40F5FFFC21C51D5740B497D09DE27B3A40F4D12D84C01D574019D50270DE7B3A40044B7628BF1D5740F03D66A2DD7B3A4003A36C74BD1D574064F4B811ED7B3A40AC9DB351BA1D5740F486CDB90C7C3A403EB67CF6B61D5740185D6C1E2F7C3A40A49860F4B11D5740E177D77D637C3A40B415EC04B11D574094F21E116D7C3A40	2026-09-17 07:20:17.871158+00
20	6	LP-DHIN-003	Plot_5	\N	\N	8.20	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "Plot_5", "Use_Image": "Google earth", "Plot_Vacan": "Occupied"}	{}	0103000020E61000000100000013000000075D26B5DE1D5740F9C584ED5A7B3A4001AB90CEDD1D57409DA026EE5C7B3A408EED29FDDC1D574030ED1D125F7B3A404FF9242ADC1D5740F07BD8B0667B3A4067EFC559DA1D5740892AAAE2777B3A40F9177DE2D61D57400E586A419B7B3A4018340B43D21D574022BC65B8CB7B3A40229728AAD01D574014085681DD7B3A4051F4C346D01D574079853B27E47B3A40D3F11CA7D11D5740E4018420E87B3A404E573B6DD81D574045C459DBF17B3A40F891A576DF1D574029C855F2F97B3A40C1E3F08DE41D5740D85FF2F3FF7B3A404CC9BC0FE61D5740F3EDB77DF27B3A4050A62F9BED1D5740CF04F0D79E7B3A409166488CF11D5740B07822A4757B3A40C9CAA253EB1D5740C5957D336C7B3A400F63AA54DF1D57406E4848955B7B3A40075D26B5DE1D5740F9C584ED5A7B3A40	2026-09-17 07:20:17.872667+00
21	6	LP-DHIN-004	Plot_2	\N	\N	1.79	Vacan	General	Government Land Bank	{"Id": 0, "Plot_Name": "Plot_2", "Use_Image": "Google earth", "Plot_Vacan": "Vacant"}	{}	0103000020E6100000010000001C000000521A6A9CC41D5740E4E8FA7FA87B3A40FF8988E3C31D574086454AFEAD7B3A4068AC7B02C31D57401A5AFAF6B57B3A40389804BCC11D57403C1C3700C27B3A4063F522CFC01D5740DF45EB51CC7B3A402A2FB80FC01D5740FE2DB682D37B3A405AA9A3EBBF1D574014896C32D57B3A40473B401AC01D57405F92E78BD57B3A404E41D22FC11D5740E1656B39D87B3A40AADD45E1C21D5740013E45E9DA7B3A40A36EF64FC51D5740BB1909C4DD7B3A40AE914E4FC81D57406BCA1FF1E07B3A40FC4EC043CA1D5740669BA701E37B3A4092F32BD4CB1D574030115E70E47B3A4056AD0517CD1D5740E0E6479DE47B3A40D10AA418CE1D5740BA908276DF7B3A40BC93EA04CF1D574023AAD32DD77B3A40F9C582FCCF1D57405C7CFE44CE7B3A40D29D26C7D01D5740866B34C4C67B3A40CF371043D11D57406B3797EBC17B3A40D76E917BD11D5740BAC2001BBF7B3A40C507CF92D11D5740C7B9ADD1BB7B3A401BB2E05BD11D5740A229954FB97B3A4051FADCE1D01D574067E9F5BCB77B3A404E89BB03D01D5740044EAED8B57B3A40CD26D530CE1D5740B0286B50B37B3A40EA60258ACC1D574088CA5FE1B17B3A40521A6A9CC41D5740E4E8FA7FA87B3A40	2026-09-17 07:20:17.873913+00
16	5	LP-CHOU-001	Chouhdhuripara	\N	\N	32.60	Vacan	General	Government Land Bank	{"Id": 0, "Plot_Name": "Chouhdhuripara", "Plot_Vacan": "Vacant", "Used_Image": "Google Earth"}	{}	0103000020E610000001000000B7000000D162871EB6D25640974B7C87140A3A40C40DB12EB7D25640D41632C3050A3A40B9E5A2F7B9D25640055ACFCBE0093A40AA4EC761BAD25640B82BABF5D9093A406DC39072BAD25640E313BB34D6093A40C97C56F2B8D25640AD3E7336CD093A4069E1E618B1D2564085744D14C6093A40B95AE9A5A5D25640619EF764BB093A40C447771D97D25640A62F1F37AE093A402905929791D25640DCC7F3CDB1093A4047B1294991D25640BDFAD56CB7093A403137AC1691D25640586B64A4BB093A402F2A88B090D256404252B928BE093A407D34F53D90D25640F8B308BCBF093A40D7E440A48FD2564064FD1975C0093A40E251CFE98ED2564053DD5B9CC0093A401B628A2F8ED25640C2A38993C0093A40A33D45548DD256406D060641C0093A40C355396E8CD256405670BE34BD093A409B2C5B868BD2564005A7609FA6093A40E5E894A38BD25640E8AE76CFA3093A40F1893F538CD256406B2371EEA0093A403E78DE228DD25640B81B95779F093A40F94202F88DD2564094EB8B399F093A40C92CD8E08ED25640B2A992449F093A405BA575C88FD25640879B25A0A0093A409D765F3E90D25640FAA9A39EA2093A407E258A2D91D25640C8286D2DAA093A4046CB526291D25640C16624A8AA093A40CDAF4DFB96D2564000F7A502A8093A4049669DA197D256408394850AA8093A407BF0126BA3D25640BA4704BEB2093A40E021E429ABD25640184BF3DEB9093A40F348006FB1D25640131E4255BF093A40D3C6A014B7D25640EED5EB93C4093A40B782164FB9D256404E10B877C6093A409D4E83B1BBD256402E1F1222C1093A40F2FC0B7CBCD256408CB82CFABD093A40064CE433BFD2564023CC8AE895093A4087D5EB9AC0D256403FAAAFA780093A4055B8F7FAC2D25640F7A88BFA59093A409EAD8E9CC4D25640E4641A2546093A40E968B5D0C5D25640340AAB582E093A40170D40B7C8D256409BEA033531093A4037F0907CC6D25640EC11E57953093A40D84F0F9CC4D25640485EE1956A093A402A236BA0C2D256403C41D74082093A40B2287B57C1D25640768B63C193093A40B35C1AF1C0D2564051567E1F9A093A40115ED325C0D25640734F0943A5093A40C392A267BFD2564000434EA3B0093A404229C963BED25640070DD761BF093A405E884851BED25640E167E565C1093A402C2F806ABED2564019EFC7E7C2093A40F22183E4BFD2564098448C6DCB093A4079A2F35AC0D2564092DFCBDBCC093A407A9ED0A9C1D2564056D02A18CE093A4070C4A508C4D25640764FC839D0093A40DD8BED36C9D25640FDE09006D5093A4058EB055CCDD256409F6C5ACAD8093A40EEBF8606D1D25640506C1A04DC093A40EE66B02ED5D256402ECD2610E0093A40A5282A44D8D25640D28F868EE2093A400082A806DBD2564006D3E3D8E4093A408CCE368ADDD25640001F26D8E6093A40C2A7472CDFD25640BD30690CE8093A40286BD438E1D256403499AD39E9093A401D036DA6E6D2564087FBAC53EA093A40765F51D4E9D25640E6C59D9AEB093A404EB0378EEDD25640944E0294EC093A40DEC1393EF1D25640CCB8E274ED093A40F58C7D97F4D256409718CB99EE093A406C6A94CFF7D256406D7316A5EF093A409BF445AAFAD2564035031AF4F0093A4034242120FED25640DE10048FF3093A404ADE819601D356409691B099F5093A409088BB8B03D356403730D9D1F6093A404D8ECC0505D35640FCAA3D1CF8093A402B48D97D05D35640E320C0CDF7093A4008BF91E605D35640F524E315F6093A406E59F02706D35640BE01E3BFF3093A403413858106D3564049AAE7D0EC093A4008FA8C0B07D3564007AD9B41E0093A40AB79081008D3564025DB1231CD093A405952DF8508D35640EBB8997AC4093A40913BA5CF08D356409D0576A6BC093A40693DA9A608D35640E8EC6633BA093A406D6FCE6208D35640BEC23407B8093A40B4DADBE407D356405FF961EBB3093A4031263EB907D35640205CDAB7B0093A4039F574D607D35640603CEEE7AD093A403B316F2508D35640606D6B3EAB093A4058CCF5C608D35640F5A51A41A9093A40BF71D06309D35640945D3DB8A8093A40C4D244140BD356407F729BC0A8093A401E04945C0BD35640991973B4A9093A40AB3E3E110CD35640B2C01A34AC093A403F3E7F970CD35640B0AE99ECB0093A40617F715C0CD35640572A9FD3B4093A40C39C5AF80BD35640370C7022B8093A40114654D10AD35640FFB08362BC093A401F3258360AD35640C3967818BF093A401A4796C209D356406954735BC4093A40C51FD93007D3564041685B16F8093A403751FEBD06D356407745ED5EFC093A40CE74B17C05D3564052070A0DFF093A40AF251EBA04D356407C59229AFF093A40E954027602D35640577EC857FD093A4073819640FED256401E1E293BF9093A4022D2C6AFF8D2564018BF9708F6093A40372918F3EAD25640C6ACD578F1093A4060FD6E97DDD25640C5C693EDEC093A40F257B693BFD256401A1985A3D3093A40B0127878BCD25640C8DA892AD9093A402D70A80FBBD25640DA8E9A8EE8093A406DC8E911B9D256403B09C412030A3A401E8DB4EAB7D256409860ECA7140A3A409755D679D9D25640CB544105170A3A403DB32508DCD25640592C0B09FF093A40F99C761FDED25640EB4240CBEF093A40CFDA8779F9D2564000EAE8C5020A3A40E50FD1EFFAD25640763A61C3F9093A40D73C435211D3564004C497CD140A3A40C0A0876114D35640B56ACD38DD093A4038D1D13A14D35640C84C291CD7093A407786A2D913D356402CE64746D4093A40D610E02B14D35640DF8DD847CF093A40C0A33B1C15D356401B276B2FC7093A401727D72C16D3564009230431C0093A408A5DE95317D356401BFF86E3B8093A40CA785C8C17D356406095AECDB7093A408D0FE9D415D356404E24F356B3093A403EE6DE7514D35640E8168734AF093A400F1548D013D3564089B95C64AE093A4077B8A80C0FD356404DEDDF2AAE093A40B13322F10CD35640BA2790FFA9093A4039F2EEFF0AD35640E8944107A8093A4033D1F96807D35640922F4773A6093A40B9E790BA04D35640DFBD673AA5093A409A3A851602D35640761161CAA4093A40D16B5CE000D35640E85F9B6BA4093A40E36CB31801D3564035FAE070BB093A40D1CC3C4CF6D25640E424D6E5CA093A40A077A8B5FAD25640ADEC66B9D8093A40F9B7EEF1F9D256406653C783E0093A405DC6AF63EDD25640CB667CB8C6093A40C88067D3ECD256403796BFD9C6093A40B7366806ECD256400C6F4DA8D8093A4086E95AC8E5D256404BA996EDD9093A400BBC15F4E1D25640D2F70EB4D2093A40DCFC9204E1D2564056A606E9C1093A40A8C258DCDDD25640BAA04882C0093A40070E4CDBD9D25640ECC2D7BEB9093A4030AE1E68D8D2564015BA6C6AB3093A40980A43AED5D25640149D9D9BA6093A40C3B0987CD4D25640B189CB62A1093A4056063ACDD3D256401E1780299F093A40581AA961D2D2564008A52B979C093A40235ECEACCFD256401A5E9F5B96093A406484A2F0CCD256406B71D90D8C093A40E5B1CA3DCFD256402440688B7E093A40062D8E31C6D25640BF9E681265093A4064AC9A5AC7D256407B5A8FAE4F093A4027903677C9D256406AFFE0C02E093A40B9CEEBD5C4D25640AC27DF362A093A4096CBD7F9C1D2564052717F4A5A093A405F1148CBB6D25640233C2CF45B093A4062903372B1D25640E6719E5685093A40B8C41363A9D256400F4775E585093A4075F8F44594D2564034ABE6F27E093A40B8BBCE3996D25640C8809DFF89093A4027AAB2BC95D25640FBB2C25099093A401DFB052E90D25640941921CF9C093A40DC4EF2418FD25640A9310E5094093A40C5555A4E81D2564041E5993795093A40FF54B2687FD25640C76E8085C2093A4011F88A219BD2564053DF2BE5C2093A40B88BBE5699D2564000A40F32EB093A4077EA745AA7D25640E81B2BDEF0093A40951C674BA5D256400356B4081B0A3A4043DE20D8ACD25640F01C6BA2170A3A406B8EC9F1ACD2564018AAE6E1130A3A40D162871EB6D25640974B7C87140A3A40	2026-09-17 07:19:19.60715+00
17	5	LP-CHOU-002	Chouhdhuripara	\N	\N	4.06	Inner Road	General	Government Land Bank	{"Id": 0, "Plot_Name": "Chouhdhuripara", "Plot_Vacan": "Inner raoad", "Used_Image": "Google Earth"}	{}	0103000020E61000000100000076000000D162871EB6D25640974B7C87140A3A401E8DB4EAB7D256409860ECA7140A3A406DC8E911B9D256403A09C412030A3A402D70A80FBBD25640DA8E9A8EE8093A40B0127878BCD25640C7DA892AD9093A40F257B693BFD256401A1985A3D3093A4060FD6E97DDD25640C5C693EDEC093A40372918F3EAD25640C6ACD578F1093A4022D2C6AFF8D2564017BF9708F6093A4073819640FED256401E1E293BF9093A40E954027602D35640567EC857FD093A40AF251EBA04D356407C59229AFF093A40CE74B17C05D3564052070A0DFF093A403751FEBD06D356407745ED5EFC093A40C51FD93007D3564041685B16F8093A401A4796C209D356406954735BC4093A401F3258360AD35640C3967818BF093A40114654D10AD3564000B18362BC093A40C39C5AF80BD35640370C7022B8093A40617F715C0CD35640572A9FD3B4093A403F3E7F970CD35640B1AE99ECB0093A40AB3E3E110CD35640B3C01A34AC093A401E04945C0BD356409A1973B4A9093A40C4D244140BD356407E729BC0A8093A40BF71D06309D35640935D3DB8A8093A4058CCF5C608D35640F4A51A41A9093A403B316F2508D35640606D6B3EAB093A4039F574D607D35640613CEEE7AD093A4031263EB907D35640205CDAB7B0093A40B4DADBE407D356405FF961EBB3093A406D6FCE6208D35640BDC23407B8093A40693DA9A608D35640E9EC6633BA093A40913BA5CF08D356409C0576A6BC093A405952DF8508D35640EBB8997AC4093A40AB79081008D3564025DB1231CD093A4008FA8C0B07D3564007AD9B41E0093A403413858106D3564048AAE7D0EC093A406E59F02706D35640BE01E3BFF3093A4008BF91E605D35640F524E315F6093A402B48D97D05D35640E220C0CDF7093A404D8ECC0505D35640FCAA3D1CF8093A409088BB8B03D356403730D9D1F6093A404ADE819601D356409691B099F5093A4034242120FED25640DE10048FF3093A409BF445AAFAD2564036031AF4F0093A406C6A94CFF7D256406D7316A5EF093A40F58C7D97F4D256409618CB99EE093A40DEC1393EF1D25640CBB8E274ED093A404EB0378EEDD25640944E0294EC093A40765F51D4E9D25640E5C59D9AEB093A401D036DA6E6D2564087FBAC53EA093A40286BD438E1D256403499AD39E9093A40C2A7472CDFD25640BE30690CE8093A408CCE368ADDD25640001F26D8E6093A400082A806DBD2564006D3E3D8E4093A40A5282A44D8D25640D38F868EE2093A40EE66B02ED5D256402ECD2610E0093A40EEBF8606D1D256404F6C1A04DC093A4058EB055CCDD256409F6C5ACAD8093A40DD8BED36C9D25640FEE09006D5093A4070C4A508C4D25640764FC839D0093A407A9ED0A9C1D2564056D02A18CE093A4079A2F35AC0D2564093DFCBDBCC093A40F22183E4BFD2564099448C6DCB093A402C2F806ABED2564018EFC7E7C2093A405E884851BED25640E167E565C1093A404229C963BED25640070DD761BF093A40C392A267BFD25640FF424EA3B0093A40115ED325C0D25640734F0943A5093A40B35C1AF1C0D2564051567E1F9A093A40B2287B57C1D25640778B63C193093A402A236BA0C2D256403C41D74082093A40D84F0F9CC4D25640485EE1956A093A4037F0907CC6D25640ED11E57953093A40170D40B7C8D256409BEA033531093A40E968B5D0C5D25640330AAB582E093A409EAD8E9CC4D25640E4641A2546093A4055B8F7FAC2D25640F8A88BFA59093A4087D5EB9AC0D256403FAAAFA780093A40064CE433BFD2564023CC8AE895093A40F2FC0B7CBCD256408CB82CFABD093A409D4E83B1BBD256402E1F1222C1093A40B782164FB9D256404F10B877C6093A40D3C6A014B7D25640EED5EB93C4093A40F348006FB1D25640141E4255BF093A40E021E429ABD25640164BF3DEB9093A407BF0126BA3D25640BA4704BEB2093A4049669DA197D256408394850AA8093A40CDAF4DFB96D25640FEF6A502A8093A4046CB526291D25640C16624A8AA093A407E258A2D91D25640C7286D2DAA093A409D765F3E90D25640F9A9A39EA2093A405BA575C88FD25640879B25A0A0093A40C92CD8E08ED25640B2A992449F093A40F94202F88DD2564094EB8B399F093A403E78DE228DD25640B81B95779F093A40F1893F538CD256406B2371EEA0093A40E5E894A38BD25640E9AE76CFA3093A409B2C5B868BD2564006A7609FA6093A40C355396E8CD256405670BE34BD093A40A33D45548DD256406E060641C0093A401B628A2F8ED25640C2A38993C0093A40E251CFE98ED2564053DD5B9CC0093A40D7E440A48FD2564063FD1975C0093A407D34F53D90D25640F9B308BCBF093A402F2A88B090D256404252B928BE093A403137AC1691D25640576B64A4BB093A4047B1294991D25640BEFAD56CB7093A402905929791D25640DCC7F3CDB1093A40C447771D97D25640A52F1F37AE093A40B95AE9A5A5D25640619EF764BB093A4069E1E618B1D2564085744D14C6093A40C97C56F2B8D25640AD3E7336CD093A406DC39072BAD25640E313BB34D6093A40AA4EC761BAD25640B82BABF5D9093A40B9E5A2F7B9D25640055ACFCBE0093A40C40DB12EB7D25640D51632C3050A3A40D162871EB6D25640974B7C87140A3A40	2026-09-17 07:19:19.609722+00
18	6	LP-DHIN-001	Doubtful	\N	\N	47.72	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Doubtful", "Use_Image": "Google earth", "Plot_Vacan": "Doubtful"}	{}	0103000020E6100000010000008A000000B9759E92C81D5740572C22F0917C3A40F8CCA9EDD11D5740F3EC195C8E7C3A40FFE54AF9D21D574031FFA19C837C3A4090358D20D61D57401C79B5A8837C3A40BA8C1635D81D5740CB54675C777C3A40CB07ACD5DA1D57400B7AB222687C3A406C2607B3E31D5740D5607097077C3A408589A5C7E31D57405BFE41DF067C3A40C980EF6CDC1D574046D49594FD7B3A40B62CF13CD61D5740BF66537CF47B3A40218A0276D11D574038A6D826EE7B3A4090F78AAACF1D574070D044B6EE7B3A40D34CF0E6CE1D5740378AA23EF17B3A40E0AFB177CE1D57404673EF70F37B3A40DC8A8D2FCD1D5740787A618D037C3A409CD939C8CB1D5740FE7E0749157C3A40AA476B88C91D57409C65111E307C3A40ED9DD63BC81D5740650511C2417C3A4092873F17C61D57408A15A6E65A7C3A407455C7F8C31D5740CF8846EC757C3A4052ED6717C21D574033DD24A98D7C3A40F9027855C11D57403D26924E8E7C3A40A2DF1211BF1D574007C00FCB8C7C3A4083A2BDD6BC1D5740F3DDDD6C897C3A40EDFE139DBA1D5740340FA110867C3A40B1F87FE6B71D5740BBEFEA85817C3A40122AD14BB51D5740B2BB85C97C7C3A40EAA328A3B21D57406E85033F787C3A4011E99C57B01D57406EC4FD25747C3A40CE13390DAF1D5740BE0B20A46E7C3A408C9B692BAF1D5740C56A81046E7C3A4046EB8EC4B01D574017E932735B7C3A4096436BA1B31D5740191795C43C7C3A407EA7E745B61D57401D394F6E207C3A403DDB93DEB71D57404921C96D0F7C3A40814A71AFB91D5740F93F35ABFC7B3A4089E1B6A7BC1D5740238BAF5BDF7B3A4044333DE6BC1D5740ABA635B6DC7B3A40CECBE760BA1D5740DF71FE8ED77B3A40BC48AEB7B71D574077677AF9D47B3A400686E53FB61D5740E989D6F3D47B3A40670A7E51B51D5740F32E5801DB7B3A40D5F12E8FB31D574081F70A9DEB7B3A40459A8C5AB21D5740688C96D0F37B3A40ED18A4A3B11D57408B883975FA7B3A407E20D1C1B01D57402DF23403057C3A40D758FBC3AF1D574016F51027107C3A40F06D9161AF1D5740C0914779137C3A404D94CF66AE1D57400414E93D147C3A4076EC5456AC1D57405EEB45D7127C3A40D0F3BFF8A81D5740C3D7084A0E7C3A40C2F74867A21D574070FB4462057C3A40FF8E9C3BA01D574079161ED4017C3A40854551879F1D5740274C4FAAFF7B3A40F744C0509F1D5740161099F1FB7B3A40C8910AA2A01D57401BDF1901F17B3A40597A298FA21D5740FA4845E0DC7B3A40F88E58D3A31D5740AF682E32CF7B3A40D4E59A8AA41D57405902F560C77B3A4014F2A07BA51D574035C70485B87B3A40E10288B2A61D57402F03A2AFA87B3A4086368C30A71D574026E03B26A67B3A404D99ADD7A71D57408B338CC4A57B3A409F99D3DFA81D5740AD3004C3A67B3A40859654F8AB1D57405231528CA97B3A407D768734B01D57404198FF4EAE7B3A40F58331A0B31D574063952346B27B3A4042B5A19CB61D57405AF367D7B57B3A403523AF05B81D5740ABD5379AB87B3A40312D6212B81D5740ACA87FB6BC7B3A40FC18605AB71D5740FF070313C77B3A401996CEB0B61D57405A83D8ACCF7B3A404EBA5B51B81D57407308CA06D37B3A40C866EFB4BA1D574013E25BCDD57B3A403525CE53BD1D574022820513D87B3A402FD284B3BD1D57409D1AEE05D47B3A4052DA7CC8C01D57401FC256C7B37B3A40AA90D56EC21D574092C6688FA37B3A40AC3047DFC21D5740961F34D99F7B3A40EED0714CC41D57409ECD00B7947B3A40718B861DC61D5740A0CC042C817B3A40514D7B53C71D57404F4E3178747B3A409191C9EBC81D5740D8033FA4647B3A40B0651030CA1D5740D896EF91567B3A4064145049CB1D5740D39F2BCD4C7B3A4085BC9D00CC1D5740E171D5C9447B3A40DA3633C5CC1D57408367CAED3E7B3A400E19BE36CF1D57405EBE7282417B3A404900CAF5D21D5740B11DFDDE457B3A406D4652C4D81D5740CB98CCF54E7B3A40680DACCEDB1D574028BF3987527B3A40B744CA7ADD1D57401E297A17497B3A40AB71F09ADE1D5740BCE07EC83A7B3A40A02E6720E01D57409C891DB9287B3A40C26CCC3CE21D5740F3A9E98E147B3A4053FC3D9DE41D57405FC6922BFC7A3A40A5915E47E51D5740ECAFBC9CF17A3A40A1D6A959E51D574015294336EC7A3A40F60B8901E31D5740510B646BE87A3A407AF9252ADC1D574024D267CDE07A3A40D68796E8D51D574006147AD6DA7A3A401180B70AD31D574047EFD381D77A3A40886BCC16D11D5740B5E66FB8D37A3A400496D7B8CF1D5740EFE3E21DD17A3A4057CE4B4BCE1D5740D49A30C1CA7A3A404BD12AE8CA1D57400E57F03DC67A3A400C4D40F4C81D5740178D8A74C27A3A40788479FBC71D57402C1DD491BC7A3A40F44AEB45C71D5740AAD86747B57A3A409943E825C71D5740796B8994B07A3A40D51AA86AC71D574057B53802AA7A3A40224A416CC71D57406C687F9BA47A3A401A1D4EAAC51D5740BDAD154BA17A3A403054915EC41D5740768142F4A07A3A400B94AA6DC71D57409265A9F7EC7A3A409AFBAD33C71D5740FD69C6CAF47A3A405C0177BAC41D5740FEE3F88D157B3A40B7067598901D5740EE010C01537B3A40F3E349B5881D57405B0EBB3F4D7B3A405CAE0C18821D5740F41F95A59A7B3A402A78DCC2811D574087802947A07B3A40AAC10067821D5740074E89EAA97B3A40F37E3EAD861D57404B34C9FCC47B3A4077B08C44931D574096BD0D8AFD7B3A40F6BE86C9A21D5740082EE0B53C7C3A4052B5F7B2A81D5740371B9F67527C3A401736B7F1AD1D57408D8D187F747C3A407CA9BCD8AF1D5740D0F02655797C3A409B7FD11CB01D5740FFB238027A7C3A403147A8F9B21D57403105BBF0807C3A40E9A7029FB51D5740C5AE153E877C3A40E5D38071B71D5740A7BD132F8B7C3A4056810A7CB91D574070B445E08D7C3A402F1C06BEBC1D574037E5B1AE917C3A40F0787CD4BD1D5740CC27663A927C3A40CC834E46C01D574012CA5E74937C3A400E8C4591C11D5740B4AA691A947C3A40B9759E92C81D5740572C22F0917C3A40	2026-09-17 07:20:17.868908+00
49	10	LP-NAMA-006	No.1 Nowapara	\N	\N	11.27	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Occupied", "Used_Image": "Google Earth"}	{}	0103000020E61000000100000009000000CFA2C68BF4B05640E2EFC86C8F793A40DC00B00AE5B056403FD8E32D87793A406958FE07E3B05640493E2630B3793A40D5BC41ECDFB0564081B5E639F7793A40A8D8A35909B1564066C179C1117A3A40884C140C08B15640643CBF21B1793A40AF1EF0BA07B15640893D8EA099793A4050CE0B53FAB0564059977B7F92793A40CFA2C68BF4B05640E2EFC86C8F793A40	2026-09-17 07:27:11.957673+00
22	6	LP-DHIN-005	Plot_3	\N	\N	3.56	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "Plot_3", "Use_Image": "Google earth", "Plot_Vacan": "Occupied"}	{}	0103000020E61000000100000019000000BC09B921D01D57405788C000477B3A4094436693CE1D574035B844EB477B3A40DE5CB1EBCD1D5740B3E1F3414A7B3A406B3BEC34CC1D5740F4273093597B3A40A0BADB7FCB1D5740336F7E6D637B3A400F3C65F8CA1D57404996A6AE697B3A40433E65EAC91D5740B29F620F737B3A4032C1A9C5C81D57400B3393007E7B3A40B51B900EC71D57406DBB5B6A8E7B3A40DB52CDE6C41D574036801718A37B3A40A8895577C51D5740DECA3EFFA37B3A40AE82E2E5C61D5740120140FEA67B3A401FB30FB9C81D574008630B96A87B3A409F655F5FCB1D5740FA3AB799AB7B3A40BD3F3680CD1D574098A42523AE7B3A40CF53E7E3CF1D5740C54D7F85B07B3A40E02DD8F9D01D574099925FF2B17B3A409989BFF9D11D574027618596B27B3A4090E0AD8AD21D574010F85EF8B17B3A40BAD913E4D21D5740B1AE26E1B07B3A401C3A7DA3D31D574016145AB0A97B3A405FD8C869D61D57405B52C4D38B7B3A40FB6FD542D81D5740560B8689797B3A40D37A125DDB1D57405E0FD768577B3A40BC09B921D01D57405788C000477B3A40	2026-09-17 07:20:17.875107+00
23	6	LP-DHIN-006	Plot_4	\N	\N	4.37	Vacan	General	Government Land Bank	{"Id": 0, "Plot_Name": "Plot_4", "Use_Image": "Google earth", "Plot_Vacan": "Vacant"}	{}	0103000020E610000001000000210000000686E53FB61D5740E989D6F3D47B3A401996CEB0B61D57405A83D8ACCF7B3A40FC18605AB71D5740FF070313C77B3A40312D6212B81D5740ACA87FB6BC7B3A403523AF05B81D5740ABD5379AB87B3A4042B5A19CB61D57405AF367D7B57B3A40F58331A0B31D574063952346B27B3A407D768734B01D57404198FF4EAE7B3A40859654F8AB1D57405231528CA97B3A409F99D3DFA81D5740AD3004C3A67B3A404D99ADD7A71D57408B338CC4A57B3A4086368C30A71D574026E03B26A67B3A40E10288B2A61D57402F03A2AFA87B3A4014F2A07BA51D574035C70485B87B3A40D4E59A8AA41D57405902F560C77B3A40F88E58D3A31D5740AF682E32CF7B3A40597A298FA21D5740FA4845E0DC7B3A40C8910AA2A01D57401BDF1901F17B3A40F744C0509F1D5740161099F1FB7B3A40854551879F1D5740274C4FAAFF7B3A40FF8E9C3BA01D574079161ED4017C3A40C2F74867A21D574070FB4462057C3A40D0F3BFF8A81D5740C3D7084A0E7C3A4076EC5456AC1D57405EEB45D7127C3A404D94CF66AE1D57400414E93D147C3A40F06D9161AF1D5740C0914779137C3A40D758FBC3AF1D574016F51027107C3A407E20D1C1B01D57402DF23403057C3A40ED18A4A3B11D57408B883975FA7B3A40459A8C5AB21D5740688C96D0F37B3A40D5F12E8FB31D574081F70A9DEB7B3A40670A7E51B51D5740F32E5801DB7B3A400686E53FB61D5740E989D6F3D47B3A40	2026-09-17 07:20:17.877596+00
24	6	LP-DHIN-007	Inner Road	\N	\N	6.50	Inner Road	General	Government Land Bank	{"Id": 0, "Plot_Name": "Inner Road", "Use_Image": "Google earth", "Plot_Vacan": "Inner Road"}	{}	0103000020E6100000040000009D00000052ED6717C21D574033DD24A98D7C3A407455C7F8C31D5740CF8846EC757C3A4092873F17C61D57408A15A6E65A7C3A40ED9DD63BC81D5740650511C2417C3A40AA476B88C91D57409C65111E307C3A409CD939C8CB1D5740FF7E0749157C3A40DC8A8D2FCD1D5740797A618D037C3A40DFAFB177CE1D57404673EF70F37B3A40D34CF0E6CE1D5740378AA23EF17B3A4090F78AAACF1D574070D044B6EE7B3A40218A0276D11D574038A6D826EE7B3A40B62CF13CD61D5740BF66537CF47B3A40C980EF6CDC1D574046D49594FD7B3A408589A5C7E31D57405BFE41DF067C3A40C1E3F08DE41D5740D85FF2F3FF7B3A40F891A576DF1D574029C855F2F97B3A404E573B6DD81D574045C459DBF17B3A40D3F11CA7D11D5740E3018420E87B3A4051F4C346D01D574079853B27E47B3A40229728AAD01D574014085681DD7B3A4018340B43D21D574022BC65B8CB7B3A40F9177DE2D61D57400E586A419B7B3A4067EFC559DA1D57408A2AAAE2777B3A404FF9242ADC1D5740F17BD8B0667B3A408EED29FDDC1D574030ED1D125F7B3A4001AB90CEDD1D57409DA026EE5C7B3A40075D26B5DE1D5740FAC584ED5A7B3A400F63AA54DF1D57406E4848955B7B3A40C9CAA253EB1D5740C5957D336C7B3A409166488CF11D5740B07822A4757B3A4061B99705F21D5740DDC51BB0707B3A400C8F6BBEEC1D574048454F17697B3A40FC6B6D96E71D5740C2E7D493617B3A402F1932D3DF1D5740BC88FB48577B3A40315E3D84DD1D57407EE24C8D547B3A401563FFFCDE1D5740ABEDA911427B3A40CCBB02B4E01D5740C3A9FAE3317B3A407DEA5CF2E21D574077D453D91B7B3A40A1912EA8E51D5740AA480920FD7A3A40D7315492E71D5740F916516DE97A3A40BE64F905E91D57404D34931FDB7A3A40B874D036EA1D574017E2D5D0CC7A3A40F3749611EB1D57405E5E3B31C77A3A408F34ABEBEB1D5740E1FBCFEAC37A3A40A0B2ED6BED1D5740B30C4E78C37A3A409CD0BBE5EF1D5740DEA03053C67A3A408BC0720BF51D57409DDFB209CC7A3A40B5FE968F001E57408242271ADA7A3A408A181DC1001E5740D022B819D87A3A40B028C50B011E574095097413D57A3A404AC3E3F9FD1D574017018092D17A3A40F98CA322F71D5740AFC25B7CC97A3A40D5AF65BAF11D5740E97F62D4C27A3A404C9DDC35EE1D57400618B050BE7A3A405FC5DEA5EC1D5740C6E14979BB7A3A4045ECDF74EC1D57400569A5B6B77A3A40903B9ADAEC1D5740DDED888DB27A3A4063629192EE1D574009E62D169F7A3A401BA16FF5EF1D574091324D04917A3A4034DB0C7AF11D5740001354C6817A3A40E242160FF31D5740FBA81379737A3A403A38BFA8F51D574097AF5E9A597A3A403CC7E865F41D5740F4EB4E5F587A3A40BF3451BFF21D5740E6726FC9667A3A40B213CF0BF01D57401C51D6C27D7A3A40829E7721EE1D5740CACAEB29927A3A40A3BC7914EC1D57409706A3CAAA7A3A4053BE42E4EA1D57404ECC4FFCB67A3A4078CE9019EA1D574070003BB9BE7A3A40A7360641E81D5740AA8DA95ECF7A3A4094533532E71D57405F54D590DB7A3A40426FB5BBE61D5740F602D0F5E07A3A401CB04A24E61D574006C976B5E47A3A4003390B83E41D5740B0E2C1BEE37A3A4008915289E01D57408488C429E07A3A40EE67A9E8DB1D5740C5312856DC7A3A40ABD9D8C7D81D574043F1C078D97A3A403CEEB321D51D5740B8CDDFA8D57A3A40E9450701D21D5740288F3953D27A3A404CA4363FD01D5740693D958ACE7A3A40701699D1CE1D5740875A016AC87A3A408E4AF0C6CD1D574092F00E85C67A3A4059193E1BCB1D57404BF307F5C27A3A4072BBE29BC91D574057FCF959C07A3A403CB790E5C81D5740A854DBA4BB7A3A405DB0D182C81D5740577ADEB4B67A3A40E6212274C81D5740D13E2FE5AF7A3A408D263A45C81D5740F589FC16A57A3A40B170BBC0C71D574051291753A17A3A4020ED4020C61D574063480FC79D7A3A4006016232C41D574001E149AA9C7A3A403054915EC41D5740768142F4A07A3A401A1D4EAAC51D5740BEAD154BA17A3A40224A416CC71D57406D687F9BA47A3A40D51AA86AC71D574057B53802AA7A3A409943E825C71D5740796B8994B07A3A40F44AEB45C71D5740AAD86747B57A3A40788479FBC71D57402D1DD491BC7A3A400C4D40F4C81D5740178D8A74C27A3A404BD12AE8CA1D57400E57F03DC67A3A4057CE4B4BCE1D5740D49A30C1CA7A3A400496D7B8CF1D5740EFE3E21DD17A3A40886BCC16D11D5740B5E66FB8D37A3A401180B70AD31D574048EFD381D77A3A40D68796E8D51D574007147AD6DA7A3A407AF9252ADC1D574024D267CDE07A3A40F60B8901E31D5740520B646BE87A3A40A1D6A959E51D574015294336EC7A3A40A5915E47E51D5740ECAFBC9CF17A3A4053FC3D9DE41D574060C6922BFC7A3A40C26CCC3CE21D5740F3A9E98E147B3A40A02E6720E01D57409C891DB9287B3A40AB71F09ADE1D5740BCE07EC83A7B3A40B744CA7ADD1D57401F297A17497B3A40680DACCEDB1D574028BF3987527B3A406D4652C4D81D5740CB98CCF54E7B3A404900CAF5D21D5740B11DFDDE457B3A400E19BE36CF1D57405EBE7282417B3A40DA3633C5CC1D57408267CAED3E7B3A4085BC9D00CC1D5740E171D5C9447B3A4064145049CB1D5740D39F2BCD4C7B3A40B0651030CA1D5740D896EF91567B3A409191C9EBC81D5740D8033FA4647B3A40514D7B53C71D57404F4E3178747B3A40718B861DC61D5740A1CC042C817B3A40EED0714CC41D57409FCD00B7947B3A40AC3047DFC21D5740961F34D99F7B3A40AA90D56EC21D574091C6688FA37B3A40E0CBE937C21D57400C5951ABA57B3A4052DA7CC8C01D57401FC256C7B37B3A4024B954F3BD1D57408B5E4C6AD17B3A402FD284B3BD1D57409E1AEE05D47B3A403525CE53BD1D574022820513D87B3A40C866EFB4BA1D574013E25BCDD57B3A404EBA5B51B81D57407108CA06D37B3A401996CEB0B61D57405A83D8ACCF7B3A400686E53FB61D5740E989D6F3D47B3A40BC48AEB7B71D574077677AF9D47B3A40CECBE760BA1D5740DE71FE8ED77B3A4044333DE6BC1D5740ABA635B6DC7B3A4089E1B6A7BC1D5740248BAF5BDF7B3A40814A71AFB91D5740F93F35ABFC7B3A403DDB93DEB71D57404A21C96D0F7C3A407EA7E745B61D57401D394F6E207C3A4096436BA1B31D5740191795C43C7C3A4046EB8EC4B01D574016E932735B7C3A408C9B692BAF1D5740C56A81046E7C3A40CE13390DAF1D5740C00B20A46E7C3A4011E99C57B01D57406EC4FD25747C3A40EAA328A3B21D57406E85033F787C3A40122AD14BB51D5740B3BB85C97C7C3A40B1F87FE6B71D5740BBEFEA85817C3A40EDFE139DBA1D5740340FA110867C3A4083A2BDD6BC1D5740F3DDDD6C897C3A40A2DF1211BF1D574007C00FCB8C7C3A40F9027855C11D57403D26924E8E7C3A4052ED6717C21D574033DD24A98D7C3A401900000003A36C74BD1D574064F4B811ED7B3A40044B7628BF1D5740F03D66A2DD7B3A40F4D12D84C01D574019D50270DE7B3A40F5FFFC21C51D5740B497D09DE27B3A4076D467D5CA1D5740E97F0F5BE97B3A400F084076CC1D5740391C7FBAEB7B3A40ACEED4C8CC1D5740434853DDEE7B3A4080FCCC64CC1D5740B1624EAAF77B3A40000AABAFCA1D57409E8083D10A7C3A4048F3AAB5C71D5740827703002E7C3A40F6864F80C51D574088D65E204B7C3A4001FD2AB0C21D5740BB494AEB6D7C3A40CA4D09FAC01D5740FC492A66847C3A408AB838F7BF1D5740C9639BD7887C3A40C43513F6BE1D574063C11EB2877C3A4083252EBCBC1D57407C79471E857C3A4093F95D4BBA1D5740A28D51FE7F7C3A4044EADCFBB61D57400D5103DB7A7C3A405AF14D3DB31D5740589989BB747C3A4079E6B58EB11D5740631594C5717C3A40B415EC04B11D574094F21E116D7C3A40A49860F4B11D5740E177D77D637C3A403EB67CF6B61D5740185D6C1E2F7C3A40AC9DB351BA1D5740F486CDB90C7C3A4003A36C74BD1D574064F4B811ED7B3A401C000000A36EF64FC51D5740BB1909C4DD7B3A40AADD45E1C21D5740013E45E9DA7B3A404E41D22FC11D5740E1656B39D87B3A40473B401AC01D57405F92E78BD57B3A405AA9A3EBBF1D574014896C32D57B3A402A2FB80FC01D5740FE2DB682D37B3A4063F522CFC01D5740DF45EB51CC7B3A40389804BCC11D57403C1C3700C27B3A4068AC7B02C31D57401A5AFAF6B57B3A40FF8988E3C31D574086454AFEAD7B3A40521A6A9CC41D5740F1E8FA7FA87B3A40EA60258ACC1D574088CA5FE1B17B3A40CD26D530CE1D5740B1286B50B37B3A404E89BB03D01D5740044EAED8B57B3A4051FADCE1D01D574067E9F5BCB77B3A401BB2E05BD11D5740A229954FB97B3A40C507CF92D11D5740C5B9ADD1BB7B3A40D76E917BD11D5740BAC2001BBF7B3A40CF371043D11D57406B3797EBC17B3A40D29D26C7D01D5740866B34C4C67B3A40F9C582FCCF1D57405C7CFE44CE7B3A40BC93EA04CF1D574023AAD32DD77B3A40D10AA418CE1D5740BA908276DF7B3A4056AD0517CD1D5740E0E6479DE47B3A4092F32BD4CB1D574030115E70E47B3A40FC4EC043CA1D5740669BA701E37B3A40AE914E4FC81D57406BCA1FF1E07B3A40A36EF64FC51D5740BB1909C4DD7B3A40190000001FB30FB9C81D574008630B96A87B3A40AE82E2E5C61D5740110140FEA67B3A40A8895577C51D5740DECA3EFFA37B3A40DB52CDE6C41D574036801718A37B3A40B61B900EC71D57406DBB5B6A8E7B3A4032C1A9C5C81D57400A3393007E7B3A40453E65EAC91D5740B29F620F737B3A40103C65F8CA1D57404796A6AE697B3A40A1BADB7FCB1D5740336F7E6D637B3A406B3BEC34CC1D5740F4273093597B3A40DE5CB1EBCD1D5740B3E1F3414A7B3A4093436693CE1D574035B844EB477B3A40BC09B921D01D57405788C000477B3A40D47A125DDB1D57405F0FD768577B3A40FB6FD542D81D5740560B8689797B3A405FD8C869D61D57405B52C4D38B7B3A401C3A7DA3D31D574016145AB0A97B3A40BAD913E4D21D5740B1AE26E1B07B3A4090E0AD8AD21D574010F85EF8B17B3A409989BFF9D11D574027618596B27B3A40E02DD8F9D01D574099925FF2B17B3A40CF53E7E3CF1D5740C64D7F85B07B3A40BD3F3680CD1D574099A42523AE7B3A409F655F5FCB1D5740FA3AB799AB7B3A401FB30FB9C81D574008630B96A87B3A40	2026-09-17 07:20:17.878813+00
25	6	LP-DHIN-008	Plot_6	\N	\N	8.79	Vacan	General	Government Land Bank	{"Id": 0, "Plot_Name": "Plot_6", "Use_Image": "Google earth", "Plot_Vacan": "Vacant"}	{}	0103000020E61000000100000014000000B5FE968F001E57408242271ADA7A3A408BC0720BF51D57409DDFB209CC7A3A409CD0BBE5EF1D5740DEA03053C67A3A40A0B2ED6BED1D5740B30C4E78C37A3A408F34ABEBEB1D5740E1FBCFEAC37A3A40F3749611EB1D57405E5E3B31C77A3A40B874D036EA1D574017E2D5D0CC7A3A40BD64F905E91D57404D34931FDB7A3A40D7315492E71D5740F916516DE97A3A40A1912EA8E51D5740AA480920FD7A3A407DEA5CF2E21D574077D453D91B7B3A40CCBB02B4E01D5740C3A9FAE3317B3A401563FFFCDE1D5740ABEDA911427B3A40315E3D84DD1D57407EE24C8D547B3A402F1932D3DF1D5740BC88FB48577B3A40FC6B6D96E71D5740C2E7D493617B3A400C8F6BBEEC1D574048454F17697B3A4061B99705F21D5740DDC51BB0707B3A40AF3D7570F31D5740C2CD24DF617B3A40B5FE968F001E57408242271ADA7A3A40	2026-09-17 07:20:17.879963+00
26	6	LP-DHIN-009	Plot_7	\N	\N	6.01	Vacan	General	Government Land Bank	{"Id": 0, "Plot_Name": "Plot_7", "Use_Image": "Google earth", "Plot_Vacan": "Vacant"}	{}	0103000020E610000001000000120000003A38BFA8F51D574097AF5E9A597A3A40E242160FF31D5740FBA81379737A3A4034DB0C7AF11D5740001354C6817A3A401BA16FF5EF1D574091324D04917A3A4063629192EE1D574009E62D169F7A3A40903B9ADAEC1D5740DDED888DB27A3A4045ECDF74EC1D57400569A5B6B77A3A405EC5DEA5EC1D5740C6E14979BB7A3A404B9DDC35EE1D57400618B050BE7A3A40D5AF65BAF11D5740E97F62D4C27A3A40F98CA322F71D5740AFC25B7CC97A3A404AC3E3F9FD1D574017018092D17A3A40B028C50B011E574095097413D57A3A4097ACA641061E57400B0E99099F7A3A40C6B8CD180B1E574009A606FD6D7A3A4063DCCA78041E574052C4856E677A3A40B242E93AF91D5740E7B682165D7A3A403A38BFA8F51D574097AF5E9A597A3A40	2026-09-17 07:20:17.880812+00
27	6	LP-DHIN-010	Doubtful	\N	\N	16.14	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Doubtful", "Use_Image": "Google earth", "Plot_Vacan": "Doubtful"}	{}	0103000020E610000001000000250000003BC7E865F41D5740F3EB4E5F587A3A4030BBBD57F41D5740C13B7B51587A3A4000EF4CAFE01D57400410BF0A457A3A40BA8F8F56D01D57407561B81E367A3A40BC0631A5C01D57406A447D08267A3A40DFBFEBEFBF1D57405D925E32277A3A402E1486A9BF1D5740BF41B5EE297A3A40DB440CDFBF1D57405FC6312D317A3A4006016232C41D574000E149AA9C7A3A4020ED4020C61D574063480FC79D7A3A40B170BBC0C71D574051291753A17A3A408D263A45C81D5740F589FC16A57A3A40E6212274C81D5740D13E2FE5AF7A3A405DB0D182C81D5740577ADEB4B67A3A403CB790E5C81D5740A854DBA4BB7A3A4071BBE29BC91D574057FCF959C07A3A4059193E1BCB1D57404BF307F5C27A3A408E4AF0C6CD1D574092F00E85C67A3A40701699D1CE1D5740875A016AC87A3A404CA4363FD01D5740693D958ACE7A3A40E9450701D21D5740278F3953D27A3A403CEEB321D51D5740B8CDDFA8D57A3A40ABD9D8C7D81D574044F1C078D97A3A40EE67A9E8DB1D5740C5312856DC7A3A4008915289E01D57408488C429E07A3A4003390B83E41D5740B0E2C1BEE37A3A401CB04A24E61D574006C976B5E47A3A40426FB5BBE61D5740F602D0F5E07A3A4094533532E71D57405F54D590DB7A3A40A7360641E81D5740AA8DA95ECF7A3A4078CE9019EA1D574071003BB9BE7A3A4053BE42E4EA1D57404ECC4FFCB67A3A40A3BC7914EC1D57409706A3CAAA7A3A40829E7721EE1D5740CACAEB29927A3A40B213CF0BF01D57401C51D6C27D7A3A40BF3451BFF21D5740E6726FC9667A3A403BC7E865F41D5740F3EB4E5F587A3A40	2026-09-17 07:20:17.881788+00
38	8	LP-NAKH-005	Nakhola Grant	\N	\N	2.30	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Nakhola Grant", "Plot_Vacan": "Doubtful", "Used_Image": "Google Earth"}	{}	0103000020E6100000010000001A000000607512B1EC0D5740873F9429741F3A401DC7B0D6EB0D5740768F7EE3761F3A4054A9257AEA0D57409771A01E7C1F3A40ADCC23D6E80D5740C578B858821F3A406D218F04E70D5740B3F13C538B1F3A40BE15E4CAE50D57409991E50F921F3A407F3B297CE60D5740953522D4921F3A40911CE54BEA0D5740E8768C4A951F3A40A6A9065BEF0D5740B9873668981F3A40F85CA73DF40D57401C7907C59B1F3A40B8D2AE21FA0D5740B40B8C679F1F3A40C4362704FF0D57408DB38724A31F3A4056DE0F1C040E57408ED57782A61F3A40C8D03AEE090E57407DF7AF64AA1F3A40913805FC0D0E5740A34D841CAD1F3A405500159F070E5740BD345073A11F3A40468F2971050E574024366CE59D1F3A400D090079030E5740B4CB1D38991F3A40F034399C010E5740306C80CA921F3A40BEC3D292FE0D5740EEE7D254891F3A406D3E9FB5FC0D57405BE7B5E7831F3A40030A857FFA0D574092D6CBB87E1F3A40B201C9DDF60D57402B017A81781F3A4068DBCAB5F20D57408E1D86C8741F3A4039737B2DF00D57401FC894FA741F3A40607512B1EC0D5740873F9429741F3A40	2026-09-17 07:22:26.367848+00
28	7	LP-DOLA-001	Dolai gaon part_3	\N	\N	5.87	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Dolai gaon part_3", "Plot_Vacan": "Doubtful", "Used_Image": "DLR Image"}	{}	0103000020E61000000100000028000000A9E7447724A25640AF3CE8D1B17A3A4002C4D4D525A2564016ADFD02CE7A3A402AD2889828A25640649464A1F27A3A406B6631E21AA25640D1628C10017B3A40AD5A671D1CA25640261029990F7B3A40CF5DE1141DA25640E414F32B147B3A40D44384251EA25640659EE5E0197B3A4082FF7A881EA256402BF40DC01A7B3A40F54484782EA256407B70FBAD107B3A405B235B2733A256403F4DBAFF0D7B3A40247C33C634A256404BB21E5C0D7B3A4033FC4B9036A256404B83A0620A7B3A4016DE2D7E3AA25640F4556689F87A3A40A7430F463EA256404BE5FA2CE57A3A408DF3C5A042A25640C57CB2DAD17A3A40461C620C44A2564009C320B9CA7A3A400663A23044A256406EC975AFB47A3A4006B51F1D41A2564025203597AF7A3A40C8017AA53FA25640F630C4DDB07A3A4050EE3BD23BA2564042E89E5CB77A3A40CF83B10638A25640A49253BCBE7A3A40288C381E39A256403E935938D67A3A40FCCBBA1238A25640E03A0186D67A3A40FE85EF2937A25640C3C606EFC37A3A40B5A5E26836A2564004BFF0E0C17A3A40992C075C35A25640084EDF2EC37A3A409B762B7230A256406736329BCB7A3A409CA46DE129A256405352884BD77A3A4069841CAC27A25640F5C7067CC07A3A404A68582927A256406730D2EFB77A3A402DE0BBD226A25640DEDDC2A6AF7A3A4059D4879727A2564034A3AA71A87A3A40499D582F2AA25640008C45B9977A3A404FC8DA482EA25640015665AC7E7A3A4036EA1FEF2BA25640785E44617A7A3A40CF7AA7E529A256405350E98A897A3A40CDE8FCD228A25640D7DB041A8F7A3A4059AF17AE27A2564009836057937A3A40E9BB29EC22A256407399AD1F9F7A3A40A9E7447724A25640AF3CE8D1B17A3A40	2026-09-17 07:21:04.883112+00
29	7	LP-DOLA-002	Dolai gaon part_3	\N	\N	0.49	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Dolai gaon part_3", "Plot_Vacan": "Doubtful", "Used_Image": "DLR Image"}	{}	0103000020E6100000010000000A0000001FD1241543A25640C7422FBD677A3A405C6D7CAB41A25640A8505BE6677A3A40C3BB32D440A25640ACF0F217697A3A4092B15A6D40A256401CC431B26C7A3A401E2E907440A256402E7B9475747A3A401019861341A256407B124F94A97A3A40133D602244A2564046CACDE7AE7A3A40EE5A1C8C43A2564008CC00298C7A3A40FCA7781C43A25640E5350D8C687A3A401FD1241543A25640C7422FBD677A3A40	2026-09-17 07:21:04.885277+00
30	7	LP-DOLA-003	Dolai gaon part_3	\N	\N	1.68	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Dolai gaon part_3", "Plot_Vacan": "Doubtful", "Used_Image": "DLR Image"}	{}	0103000020E6100000010000000B0000005E8F5E423FA25640FA508FFC697A3A4097E675933EA25640BE12A3AF677A3A40C5633DE839A256402863CC5D697A3A4099498ED935A25640CE83642B6C7A3A4091DBC68437A25640D717F38FB57A3A40E206912838A25640F62DB67CB97A3A408327679D3EA256404EB5BAAAAE7A3A40C375B8B53FA256400CDEE27CAB7A3A40B1C874F83FA2564001444940A87A3A4072EFE2983FA256402D37586F8C7A3A405E8F5E423FA25640FA508FFC697A3A40	2026-09-17 07:21:04.886291+00
31	7	LP-DOLA-004	Dolai gaon part_3	\N	\N	2.21	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Dolai gaon part_3", "Plot_Vacan": "Doubtful", "Used_Image": "DLR Image"}	{}	0103000020E61000000100000012000000714EAFCB34A2564032B97B6B717A3A40A215D2E233A25640E09F36D6707A3A4037515ADE32A256406E3CDD84727A3A40D98AC62231A25640168741E8777A3A405CD9DF472EA256404CF9E79A857A3A406E98D6A129A25640F11A1914A47A3A4038F9545528A25640E9C06AE0AC7A3A40D43E1B1328A256407ECCE8BCAF7A3A40FF38400528A2564026294D5DB37A3A405870E0322AA25640CCBD5ECECF7A3A40E70687572BA25640ED31E1A2D07A3A4071A8113A32A256401007BAB7C37A3A4039E8EB8435A25640A94B4150BF7A3A409FDE871536A2564012BCA4B9BD7A3A4000AA9F7236A256400AA0F5BEBA7A3A40EF80149136A2564068360A00B87A3A4067FBE6D134A256406DDB0FC7717A3A40714EAFCB34A2564032B97B6B717A3A40	2026-09-17 07:21:04.887514+00
32	7	LP-DOLA-005	Dolai gaon part_3	\N	\N	1.34	Inner Road	General	Government Land Bank	{"Id": 0, "Plot_Name": "Dolai gaon part_3", "Plot_Vacan": "Inner Road", "Used_Image": "DLR Image"}	{}	0103000020E610000003000000260000009CA46DE129A256405352884BD77A3A409B762B7230A256406736329BCB7A3A40992C075C35A25640084EDF2EC37A3A40B5A5E26836A2564004BFF0E0C17A3A40FE85EF2937A25640C3C606EFC37A3A40FCCBBA1238A25640E03A0186D67A3A40288C381E39A256403E935938D67A3A40CF83B10638A25640A49253BCBE7A3A4050EE3BD23BA2564042E89E5CB77A3A40C8017AA53FA25640F630C4DDB07A3A4006B51F1D41A2564025203597AF7A3A400663A23044A256406EC975AFB47A3A409DDF973344A256408DF7F6E2B27A3A40133D602244A2564046CACDE7AE7A3A401019861341A256407B124F94A97A3A401E2E907440A256402E7B9475747A3A4093B15A6D40A256401CC431B26C7A3A40C3BB32D440A25640ACF0F217697A3A405C6D7CAB41A25640A8505BE6677A3A401FD1241543A25640C7422FBD677A3A40E90870E242A25640D5C3AA25627A3A40FD98DFF73EA256408190C9E8627A3A409A338A9E3CA2564056216A37637A3A40C86C8B9739A2564029101392637A3A4002A3671A37A256404EA5E2A6657A3A40245FEEC035A25640EFF36DF0677A3A40047A45B534A25640E6F715B6697A3A404426C85434A25640767022946A7A3A40F650BA9132A25640588621A26E7A3A40949EF0D230A25640668CF61C737A3A40781A9D122FA256406B3F1BB8787A3A404FC8DA482EA25640015665AC7E7A3A40499D582F2AA25640008C45B9977A3A4059D4879727A2564034A3AA71A87A3A402DE0BBD226A25640DEDDC2A6AF7A3A404A68582927A256406730D2EFB77A3A4069841CAC27A25640F5C7067CC07A3A409CA46DE129A256405352884BD77A3A401200000039515ADE32A256406E3CDD84727A3A40A215D2E233A25640E09F36D6707A3A40714EAFCB34A2564032B97B6B717A3A4067FBE6D134A256406DDB0FC7717A3A40EF80149136A2564068360A00B87A3A4000AA9F7236A256400AA0F5BEBA7A3A409FDE871536A2564012BCA4B9BD7A3A4039E8EB8435A25640A94B4150BF7A3A4073A8113A32A256401107BAB7C37A3A40E70687572BA25640ED31E1A2D07A3A405870E0322AA25640CCBD5ECECF7A3A40FF38400528A2564026294D5DB37A3A40D43E1B1328A256407ECCE8BCAF7A3A4038F9545528A25640E9C06AE0AC7A3A406E98D6A129A25640F11A1914A47A3A405CD9DF472EA256404CF9E79A857A3A40D98AC62231A25640168741E8777A3A4039515ADE32A256406E3CDD84727A3A400C000000B0D48FFC35A256403305EA2E727A3A4099498ED935A25640CE83642B6C7A3A40C5633DE839A256402863CC5D697A3A4097E675933EA25640BE12A3AF677A3A405E8F5E423FA25640FA508FFC697A3A4072EFE2983FA256402D37586F8C7A3A40B1C874F83FA2564001444940A87A3A40C375B8B53FA256400CDEE27CAB7A3A408327679D3EA256404EB5BAAAAE7A3A40E206912838A25640F62DB67CB97A3A4091DBC68437A25640D717F38FB57A3A40B0D48FFC35A256403305EA2E727A3A40	2026-09-17 07:21:04.888645+00
33	7	LP-DOLA-006	Dolai gaon part_3	\N	\N	1.49	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Dolai gaon part_3", "Plot_Vacan": "Doubtful", "Used_Image": "DLR Image"}	{}	0103000020E6100000010000000F000000A9E7447724A25640AF3CE8D1B17A3A402EF3C28920A256400EC93381BE7A3A404391853222A256403DCF7EEED37A3A40807F82B521A25640CA942D77D77A3A40CE584B7B1EA2564069B87A17DB7A3A40F6E35F701AA2564041DED4F9DF7A3A4006F3E97D19A25640162EA881E17A3A401725231D19A256409416DFEBE37A3A40ADA79D1219A2564072D530BCE67A3A40C3D92CF019A25640E8CE9B80F47A3A40671387A41AA25640C105AD38FE7A3A406B6631E21AA25640D1628C10017B3A402AD2889828A25640649464A1F27A3A4002C4D4D525A2564016ADFD02CE7A3A40A9E7447724A25640AF3CE8D1B17A3A40	2026-09-17 07:21:04.889629+00
42	9	LP-NALT-002	Naltali	\N	\N	2.12	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Naltali", "Plot_Vacan": "Doubtful", "Used_Image": "Google Earth"}	{}	0103000020E6100000010000000D000000D3E563AF593857405AF0AAADFC8F3A40A05BADF14E385740C96C0FEDED8F3A4022E23A104938574098D5B92312903A402DBE0A06463857404019346429903A4023E0C6F4493857401813C88B31903A403861D0564A38574049CD3DCC31903A40CB1D95DC4A38574028A83EEC30903A4018140C8D4E385740E664A43237903A40779A85FC503857401163852B3A903A40CCFE1B765438574048A05FF223903A40573721C5563857401DB19E2E15903A4098826FF457385740A481E19A0D903A40D3E563AF593857405AF0AAADFC8F3A40	2026-09-17 07:23:21.211812+00
43	9	LP-NALT-003	Naltali	\N	\N	2.51	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Naltali", "Plot_Vacan": "Doubtful", "Used_Image": "Google Earth"}	{}	0103000020E6100000010000001200000014205C4C5C385740E0D2F60AEF8F3A406C25971B57385740B08D9530E38F3A4014D8CCA0533857404054FA2CDA8F3A4098870F474F385740A0866AB9D28F3A40D0AE48094B385740608423B5C98F3A400489360649385740405564C9C58F3A40C49FA89648385740804704BEC78F3A400C3E9FC245385740C0C84A70D68F3A4058E0F14E4338574090EB2D21E48F3A4084C12AE94038574090C14F36F28F3A402057B5463F385740B0899967FB8F3A40B8C7158C3F3857402019D751FF8F3A4038A6D67E44385740804D74B509903A4028E23A1049385740C0D5B92312903A40A85BADF14E385740D06C0FEDED8F3A40D8E563AF5938574080F0AAADFC8F3A40FC2A6A445A38574050E7D3FBF68F3A4014205C4C5C385740E0D2F60AEF8F3A40	2026-09-17 07:23:21.213271+00
45	10	LP-NAMA-002	No.1 Nowapara	\N	\N	19.43	Vacan	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Vacant", "Used_Image": "Google Earth"}	{}	0103000020E61000000100000023000000A5D56392DEB0564018FA4B7DF6793A405286C0DEDEB05640DC81BEC2EC793A40A05177B8E0B0564015ED12B8C3793A4003170EF5E2B05640187F6CB892793A4015F7E9CCE3B05640D8835D2D7D793A40074C905AE5B05640F613E8A05B793A4070A9D707E7B05640F2C1FC7E3B793A407156E7A0E7B056402B074BBA2B793A40B5BF6BA3E7B05640F052A4B129793A4067243AAFD5B05640852B7CBE20793A4091B0A9A2D5B05640A64D96EA18793A40C8D13A89D5B05640133E717E12793A40F1A3D3B9D5B056408B450739FD783A40CF1D6731D6B056400CC046F5E0783A400CA48F33D6B05640032793D2D9783A4005626B59D6B05640C54D5DD1D0783A40C693A8E6D6B05640F6C59635C5783A4051EE2D7DD7B056402B94B3E3BC783A406357EF0ED8B0564032AB0B6BB8783A40E461E2E0D8B05640FEFA3B07B6783A4086F90AA3D9B056409788379BB5783A40D2A496F7DAB05640AFFB8598B5783A407B6BE3DAE5B0564079F0D468BA783A40364E8D61E6B05640AA51E580B9783A40471712F4E7B056404629599794783A40B197C89DDBB05640F34983DE91783A409B6851BEDBB056408AC83CF1B2783A40990CCC9DD2B05640AE62DC90B2783A40C9346A05D2B05640FD1B80C08F783A402BDF2D54C0B05640D6CDFDD88B783A40A26E0BA6C5B05640912A563FFD783A40C557BCC8CCB05640A0B552B68B793A40AD5E2860D0B056406C393F0ECE793A4093A86953D3B05640A94914B6F7793A40A5D56392DEB0564018FA4B7DF6793A40	2026-09-17 07:27:11.953116+00
46	10	LP-NAMA-003	No.1 Nowapara	\N	\N	11.54	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Occupied", "Used_Image": "Google Earth"}	{}	0103000020E610000001000000130000001E2758C90AB15640FC2164AB127A3A40724ACB1320B15640EFA2D01E207A3A406C3FD2D523B156406A081C4B227A3A4077BA061724B1564015918961DE793A40533556DE15B15640F369019BD6793A408EBB12E615B15640AAD5FF58D0793A40E6458BC417B15640FA930265A3793A40887D46761AB15640BB8786935B793A40CF687AD31BB1564009CB11262B793A40D7851E6D1BB1564010F3CCEC23793A40B77BD1641AB15640526164AB21793A408DD5297417B156402D700D5B1E793A401F45CB7513B15640DAD6B32A1D793A408FF3FBD20DB1564032A748FF19793A405142126809B156405C43409716793A4090D5DC4409B1564085C4601033793A400655037009B15640D8A4AC2A46793A4069A0A6AA09B15640349498BD94793A401E2758C90AB15640FC2164AB127A3A40	2026-09-17 07:27:11.954413+00
47	10	LP-NAMA-004	No.1 Nowapara	\N	\N	3.57	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Occupied", "Used_Image": "Google Earth"}	{}	0103000020E6100000010000001900000004126CFFD6B05640A65D2D4BDC783A4064AD1CCDD7B05640F1442D1ADD783A409963D444D9B056408915A6FFDC783A40C163A0C1E2B05640D7B16A81E1783A409C44EB15F0B056406BC8FF61E9783A40592D7880FCB056403C3E030DEF783A40B3450D98FDB05640E36D0DF2ED783A4051E1720AFEB05640B635346EEB783A408C733E2EFEB05640309EE0FBE4783A40180B648AFEB05640DE87D8F6DD783A400EECD188FEB05640F563C7FCD3783A4080A86365FEB05640128589E4CE783A4047871160FDB0564005A63D7BCC783A405EE93472F8B0564092500E3DC9783A40B426E7CCEEB05640B8DF73BEC3783A4068814F4AE4B05640660B8E37BD783A40171822A5DCB05640B6F1BDCDB9783A4012A689EED9B0564022CFF90BB9783A4040F568E3D8B05640A9952A54BB783A40DB9D442AD8B056404C38F6CDBE783A40769B5688D7B05640FA84B000C6783A407BDF7C2AD7B05640D1A12664CE783A407A1A43F9D6B05640C8E37971D4783A401A65B1F3D6B05640CF68EAF0D8783A4004126CFFD6B05640A65D2D4BDC783A40	2026-09-17 07:27:11.955594+00
48	10	LP-NAMA-005	No.1 Nowapara	\N	\N	2.35	Vacan	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Vacant", "Used_Image": "Google Earth"}	{}	0103000020E61000000100000007000000CAFAF82131B15640D21D85E1E1793A4030245D8F25B1564079B1B309E0793A40021D8A2725B1564005F4640E237A3A40B3D2360B33B156408E5168162B7A3A408908DCB033B1564040AA339C157A3A40AB66B4FD31B156407C6CD8FCF6793A40CAFAF82131B15640D21D85E1E1793A40	2026-09-17 07:27:11.956671+00
34	8	LP-NAKH-001	Nakhola Grant	\N	\N	84.96	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Nakhola Grant", "Plot_Vacan": "Doubtful", "Used_Image": "Google Earth"}	{}	0103000020E610000001000000EE000000E1F6F3D2420E5740C3B4845C46203A409EC3876E420E574003794D3C42203A4058A5D245410E5740D3CD482A3B203A4006A0175F400E5740D10B729237203A40193C90D23F0E57404003F9C339203A40529D30213D0E5740B7CD8B863C203A407EF87810330E5740E350DA1040203A40946579372A0E574002FCB97041203A40110596B7230E5740F65479CB3E203A40A37DA5A3230E5740FB374F7839203A402CD83CF0240E57407986FB6F3A203A401DDBF224280E574026FF86123C203A405BCABAD42A0E5740A0A8DF113D203A409EE66A8E300E5740214EE5F03B203A404E6F161B380E57404D2105F938203A40C9BFDA2E3C0E574031C3101F38203A40E5ECA2BF3D0E57400737445635203A40D1AD8AAA3F0E57405177CD6D2F203A408E5C1E3C410E57400BAE0DC42A203A40ED8239A2420E5740C7673DE823203A40010E51D1440E574075F94F3F1A203A4038E5C29B450E5740902B760014203A40E5AD9794460E574019C8321009203A40BC762C1C470E5740C9143A7003203A4063FE9AE8470E57409170017FF81F3A40A78117F9480E574056637B1DEA1F3A40E7AC85C5490E57401D83422CDF1F3A409316AF844B0E57406BC609B2D71F3A402FCE8A444F0E5740E1184A40CB1F3A40F9F70A3C500E574096DD9971C31F3A402F761828500E574056DF6F1EBE1F3A4080176BA54F0E57406EC89028B81F3A4019236A714E0E5740F02B8D8EB11F3A407775F6814B0E57402A2A56AAA91F3A40AD48DCEA490E57400A22382DA11F3A4074E6FF0A480E574017EA023EA71F3A404915378F450E57409B4C158CAE1F3A405B2C083F430E574057BC0EBCB71F3A40EB931E33420E5740C0FF2050BB1F3A40589193AD400E5740796003C9BD1F3A40D4095C3F3F0E57405B5B0899BD1F3A402CA54D093E0E5740B27275D9BB1F3A4012FF2C163D0E57404426ED52B91F3A405C7C8ECC3A0E5740E49E1203B31F3A40F1440F113A0E5740D82D942DB01F3A40702AB2FD380E574052FA0F25AB1F3A405501A370370E574042A46F29A51F3A4015C08CC1350E57401A6CF5E5A01F3A409289CC53340E5740452B6B9D9F1F3A4085C6F206330E5740321412469F1F3A4067814E4A310E574047C445CDA01F3A40FCFE803F2F0E5740AE02596BA31F3A40930478132D0E574081679FE0A51F3A402798C71E2A0E574076E59A5AAA1F3A4010210D8E270E5740A9E9A9AEAE1F3A400D145729260E5740F988CD40B21F3A40B82644CE240E5740681CEB44B91F3A40B693E87E240E57404482362DBD1F3A40730E5DE3220E5740204A5C2DBF1F3A40D4A41FA2200E57406F80F548BF1F3A40EAC5B3C1160E57409EB686BFB91F3A40FF6FA9B3030E5740967FF6DEAB1F3A404BE1E176F20D5740108F7739A01F3A40478C8476DC0D5740B7E0B957911F3A40A5E65D74DC0D57406664905F621F3A40FBF0B7A9DC0D574096B6F3654D1F3A40F1C060A1DD0D5740B9D32747451F3A4055F0ACF9DF0D57407EFB1323431F3A4008231323E40D5740E0E6638A431F3A402C1266D1E80D57402B4DE794441F3A4033D5A0BFFB0D574057F2B7B5341F3A40BE31C12CFC0D57400319561A391F3A400820BD1CE80D57404981ADC44B1F3A40C9EC7736E40D57404523301E4A1F3A4093991E01E10D57409033570C4A1F3A405B7EDFB3DF0D5740C36F6BA54A1F3A40015426D4DE0D574076ABA5B24E1F3A4019A77411DE0D57406B84FEC2761F3A403736194BDE0D574020CA04BF8B1F3A40207D078CE40D57400E300128901F3A40C84E7F70E60D5740EFBB039B841F3A4048603EC4E70D574006A11F1D7F1F3A4056F7E136EA0D57404EBC9F44731F3A40141C4950EA0D5740FE2051C16B1F3A40BC54C3FBE90D5740D21956BA611F3A4053858B1BEB0D5740A8F08CA1631F3A405F5FCE5CEB0D57404F5593C4661F3A40E8D77787EB0D5740A99297D76A1F3A405652B863EC0D5740CEFA76EE6E1F3A404786278EEE0D5740A238253B701F3A402BD81932F20D5740EB61DB3F711F3A403548DA7CF50D5740D51F1C33731F3A4030A011F3F80D5740A22B6D58771F3A40965CF2D6FC0D5740BE51B9A17E1F3A401796C8FFFE0D5740A9B848B0831F3A40D41BAEC2010E57404E32CAE38B1F3A406CFA9442040E5740E3A05206951F3A4005B6AD32070E57403346D6599B1F3A40BF2825BB0C0E57407C05AB7DA51F3A401462D5B4100E57407828E3B7AD1F3A40030717A8110E5740579E47EEAF1F3A40C921652A140E5740F416F46DB31F3A40B2585C1C170E5740BFAD3C5FB51F3A40BEDD61021B0E5740CE3BF5A5B71F3A4084F135631E0E5740BDA0CAE9B91F3A40A98BC66B210E5740C47F11EBBA1F3A40F860E23E230E57401DF00AC4B81F3A40119BA9A3240E57409F91D309B51F3A408A3A92C7250E5740BBD11D3CAD1F3A40F889000B280E5740A822E8F5A71F3A40336B6A9B2B0E574090C6E3B6A21F3A4082FB3521300E57403748B8AB9A1F3A40502C4ED2320E574036E27989981F3A401D020007360E57408E11002C9A1F3A40709FDAEC370E57405D528B29A01F3A40EF4A71823A0E5740DE84218DAA1F3A40223DA1023D0E574080BE490FB31F3A40756337573F0E5740397689AFB91F3A4094E0CAFD400E57402E10B0D7B71F3A4058F566F4430E57401AA062D3AE1F3A40B9F40473490E574034D8E6D79B1F3A40BD3D13AE4C0E574005A4CF728E1F3A404E91360D550E5740EFEE5722721F3A4069B1E5555F0E5740745DEE0A531F3A409FFACEC36E0E5740219C9D36221F3A40310CCD92770E5740C75D4BB7031F3A405CE90C77800E57405C358569E71E3A40AB6051E0850E5740FE144D3CD21E3A40596624E4850E5740C76CB727C91E3A40AE1084E6850E574042F1DE84C31E3A40C2CAEC6E850E574058462691B71E3A40B25B8E9E800E5740F66BDA51A81E3A40BD44F57F6D0E574013F37EE0971E3A40BB57528B620E574051FB85CDA91E3A408878A42D530E5740F7FF0BD9A91E3A400069003D520E5740603DF5F4AB1E3A40AA930AC9510E574097931A33AD1E3A40223CB3B6510E5740B3A96A93AE1E3A402581D6BE510E5740BE2E7E54B01E3A40B0041CA4530E5740CD207DADCC1E3A40DADAB487520E5740B965AF47CD1E3A4068B3860F530E5740D03C3412DC1E3A401C3A7D53530E574009756657E31E3A4017DE6E11540E5740900B0E22F01E3A405B0B9777540E574040959889FA1E3A40DC2B302B550E57407B37762C081F3A4016AE35FC540E5740B64E96460E1F3A40A6DBB18B540E57407D9C03DE111F3A402D7627A1530E5740E082BB4A151F3A40388E743C520E5740B04FE6DC181F3A40509C4E25500E57409D6D44741E1F3A4048D924AA4E0E57402F2045A6221F3A401746C3714C0E57409474D614281F3A40C1E20F234B0E5740153FB71F2C1F3A401AC238174A0E57408467B68B2F1F3A40126D3559490E57408BB839A9321F3A407876FA6F470E5740D78DB9A7341F3A40884DB5BE450E57405ABCDD8E351F3A4033238D3A430E57404E607571361F3A404E6135B6410E57408B1DEC18361F3A40E6B800783D0E5740B228A467321F3A408C9E037B3A0E57404BC6164E301F3A40A45985F7370E5740E10DE19F2F1F3A404B172974350E57403A3182A12E1F3A403CC4D1C3330E574022E587572D1F3A40A28B2AD0320E57404F5BA0112C1F3A40DCAB3FB0310E57400FD69A7A2A1F3A40B4DF187F2A0E5740B0AC3931271F3A40B1A6A15F280E5740CFBCFF34261F3A40FB881BBB250E5740B9DCBBE5241F3A407F0EA14D240E57403652DEFC221F3A409DCF0DEA220E5740EBEDA9E5231F3A40D8B43670210E5740B8A90EF6241F3A40402B0BB41F0E57407899B164251F3A404090ACF71D0E5740D0DA904B261F3A405A47EF5C1C0E57402913C36A261F3A400C4DB8311B0E574083F7B94B251F3A406408ACFB190E5740455D228C231F3A4066B305DC180E5740F0E8C854211F3A40A0100B7A170E5740AF88AD7B1E1F3A40CF967570160E57400D31F7941C1F3A40B7182C9E150E5740E8DCB0271B1F3A40FB11103B140E57401AB0ECF71A1F3A40F08B1504130E574021336F691B1F3A40730BC847110E5740BCCC37281C1F3A40B5087D120D0E574024E6B1A11D1F3A40FE1FBFBD070E5740E5D1916B1C1F3A40A980EF73040E57402CEA3C47181F3A40471A8632030E57408291B527171F3A400D93786A020E5740D6E1B1C3171F3A40E041B7C3010E57409AE66660181F3A404B796D1C010E57408495BD3D1A1F3A40F1C29C1B000E574004C905D21D1F3A400AD15EB6FE0D5740CC21C5A4221F3A40A74CEE24FD0D5740292851FE261F3A406C7D63B5FB0D5740B9D7DFEF291F3A40CA9B467EFA0D5740217387B12A1F3A4019A8CEA0F80D574087F5691F2B1F3A4030CA80E4F60D5740F06F2DDE2B1F3A40325570C4F40D574020479D4A2C1F3A40BFB53DA4F20D5740DE0935072D1F3A402382A88EEF0D5740D233EB8F301F3A40FE3F09AFEC0D57403B99A5B3371F3A4067A1D31FE90D57407A6725213A1F3A40A8DF8084E80D5740263AB1F5391F3A4065475C16E70D5740F526949D391F3A4064E4EB70E50D5740B29505CC381F3A406A0B7551E30D57407D66BBCF371F3A402AF344ADE00D5740E542FEB7351F3A40836EBF08DE0D57408965A568341F3A408EF007FEDC0D5740720C402B351F3A40B5616840DC0D57406ADC4058371F3A4061AA25BADB0D5740F0E69ED6391F3A4048B62707DB0D5740F6D56A1C3D1F3A40F9E28F6ADA0D5740BCA675EA3F1F3A404D556E10DA0D5740178A1B0A431F3A409271A10EDA0D57409784110A431F3A406C0AD07DD90D574057B46FCB591F3A40D7F9CEBBD90D57400A34FA2C5A1F3A4047568049D90D5740D800D1536C1F3A404E21CE03CA0D5740E24B5A975D1F3A4005B48E95C90D5740B2AF6339661F3A4047A021C0CB0D57405DE49D8E891F3A401C8343A6D20D5740F5F8BC77961F3A401EF9D01CDC0D5740463750EEA91F3A40D8542C43E20D5740DCDD5535BB1F3A4018145A1CE70D57400D6758EDCC1F3A40E3A785FDEC0D5740CFA7F84DE41F3A406D426919F20D57403E5A49CBF51F3A4069E03E50F80D57401F8ED98A07203A4005F5BA5DFF0D574098AB38891D203A40C341C26F080E5740555348A232203A404C887427100E5740A88CD4F33F203A4082BC097A1A0E5740E3BFB2364B203A408D083004220E5740564BE5314E203A40B7A4A1142A0E5740EDF0A49A4E203A40A130B3633B0E5740B24E909349203A40E1F6F3D2420E5740C3B4845C46203A40	2026-09-17 07:22:26.362527+00
35	8	LP-NAKH-002	Nakhola Grant	\N	\N	9.92	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Nakhola Grant", "Plot_Vacan": "Doubtful", "Used_Image": "Google Earth"}	{}	0103000020E610000001000000180000004D11D971700E574007385A270D203A40E097D176770E5740659DD5E804203A405BB7241A800E57409368E191F81F3A40A49739888A0E5740DF82A01DEA1F3A401D2EA20D980E5740F656AD8DDA1F3A403C2047EAA20E574060D52E16CD1F3A4019D878A0AA0E574024E67FA9C31F3A40D9EE1472B20E57400F4AC705BB1F3A4034B81FD8B60E5740B9B921D5B51F3A40CE5CA118B80E5740816A4588B21F3A400D3E6D52B80E5740E0ACB00EAD1F3A40AEAB1101B80E57403272A38CA81F3A40257FD5CBB50E5740FE4222E49F1F3A4097BDA956AF0E5740B32769C4831F3A40912B6F03A80E5740B50E05D2671F3A40D71983BFA50E57405A0C311E611F3A40EF950615A00E5740DBE36500731F3A40F71149D6980E57405A663E5A891F3A400FCFEE848F0E57400689D0AEA71F3A4071752279890E57407BF213F3B91F3A40E9D4813F7E0E5740F1F55180DE1F3A40069835BF750E574097281080FA1F3A40B7016A83700E57403FA0D3FA0C203A404D11D971700E574007385A270D203A40	2026-09-17 07:22:26.364336+00
36	8	LP-NAKH-003	Nakhola Grant	\N	\N	7.20	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Nakhola Grant", "Plot_Vacan": "Doubtful", "Used_Image": "Google Earth"}	{}	0103000020E6100000010000003A000000FF2E99FB5C0E574054124DA235203A40823982CF6C0E574084CB51BF24203A400FC1DA986D0E5740FC1880E823203A40E99BD0207C0E57402470BB4F13203A40B99E1462850E574049696E8807203A4022CC2D9D8F0E57400000548AFB1F3A400750899A9E0E57403836C5D6E81F3A40842E595CA60E57400130BA33DE1F3A403548E9EBAD0E57404AF2F143D41F3A4091EB0486B30E57405230D5FBCE1F3A406D3B9BE2B70E5740C6BA5E7ECC1F3A4089F28B4FBC0E5740C0429CB5CA1F3A40856ACDB1BF0E5740365B829BC91F3A402533B802C30E57404AAFE025CA1F3A401B2C07D9C60E5740DCDED83ACA1F3A40786A89D0CA0E5740C9ABA38CCA1F3A40208FC284CE0E5740D896D581CC1F3A40182292E9D30E5740FF129C34CF1F3A400B57C4ABD40E5740C6154B2ACF1F3A40865149ABD50E574023B9B083BE1F3A40EC02148DD10E5740551BE9D6BD1F3A40A65E662ACD0E57402F728E01BB1F3A405222FD30CC0E5740BC4CD533BA1F3A40C6630F97C70E57400DEFFCC6B61F3A4042B61665C20E574088F72EF8B11F3A40A2B588C3B90E5740B4B45033BA1F3A40697CE9D2B40E574001EECDFCBE1F3A4085C9C180AF0E5740A13CB3BEC41F3A408D2101B7A80E57401D39C1D1CC1F3A40831160369F0E5740AB095293D71F3A40AF1EA724960E574077CA5289E21F3A403B27ED688F0E574048E46638EA1F3A4071382DC0870E574095ADC89FF41F3A408E9D0CD27F0E5740E79EA605FF1F3A4055EDF29B750E5740654D744E0C203A4037C894AC6C0E574062E6521517203A40F60CA796650E57409F3768A61F203A40DCB0CCA35E0E57408443AC6326203A407F982D0A5A0E574041709CCB28203A40F21346E1550E57409B77E02327203A4005BB26AE520E574015F97FBF21203A40395136F5500E57409A434D821A203A40C09F23C54D0E574054F048EA0D203A40D966CE184B0E5740D953DFC604203A4031550547490E5740048159CC03203A403D08097E480E5740AFD7769906203A40F62A1FB4470E5740CD2DAF970B203A400E7AB0E7460E574092C2E78816203A4019BDE906460E57409C936F171D203A405B7217C1430E5740717B840028203A4009944201420E5740E3A7850B31203A403B0356DC420E57405B03C9F337203A4086BF787F440E5740E97B0A403E203A40D37E6480450E5740CEAAF33145203A40466CF7874B0E57404AC3D36842203A405E16A604530E5740D9F1B6DF3D203A40C76BC0C5570E57400882E0FB39203A40FF2E99FB5C0E574054124DA235203A40	2026-09-17 07:22:26.365573+00
37	8	LP-NAKH-004	Nakhola Grant	\N	\N	60.06	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Nakhola Grant", "Plot_Vacan": "Doubtful", "Used_Image": "Google Earth"}	{}	0103000020E61000000100000060000000AD6D0B9B6C0E57406D9F083910203A406C1AABC86E0E5740A899CD010A203A405E58AFD9730E5740822B8843FA1F3A40626505317C0E574052BD1CB2DC1F3A406EBEE54F810E5740E28F1BF4CC1F3A408EC4BA36890E57407DA808E6B21F3A4006AA5C9A940E574030F4215F8D1F3A4071572A659C0E574075E4B0E6731F3A401FBFB613A40E57403372389A5B1F3A4003011213A70E5740A557697D511F3A40437B83B8AD0E5740CF8E0BB13C1F3A4049B9A05AAF0E5740BE33AC39381F3A40D751C47BB00E5740641192883D1F3A4003902C92A60E5740DAE594115B1F3A40339D9700A70E574078F6A5725C1F3A400036EEF8A70E574008E8ABCB5F1F3A403B96DA84AD0E57404E5435A3751F3A40BAAF4D01B50E5740BC53F790921F3A40D98CE39CB80E574091B00BEEA01F3A40BA4F4B63BA0E5740B78BFA2FA91F3A40A511A3AEBB0E57406AA11121AD1F3A40E171F485BD0E574060BAA325AE1F3A40A4949826BF0E57404C0B0934AD1F3A40EC30B2F0C00E5740913284A7AC1F3A40F935DC96C10E5740BA817773AD1F3A408C1C88ADC80E5740685DB973B41F3A402666FB7FCF0E57403EB518B5B81F3A40B03BF412D30E5740D7B6838BBA1F3A40C05239C1D40E5740A0C57C30BA1F3A406F44CC14D50E57406BE9DD69B91F3A408824F2BBD50E57408927A0DCB71F3A400C9E3643D70E5740A3E18B3DB11F3A406DD22084DB0E5740635E8148A11F3A4016D2070DDD0E5740DCF071BF961F3A40D89B8E9ADD0E5740B44B0A1B901F3A40EBC204B6DE0E5740F256BCD7811F3A40E97BD199DF0E5740FA2D72F7731F3A40F2CA7B4BDF0E574090D6BD37681F3A40231E0F1EDF0E5740697E0139641F3A405D72595CDD0E5740BCA7DCCD5D1F3A40BFED5E1FDC0E5740CD2E7EB0581F3A408BEA3AE9D90E57408C051C2F521F3A401B668E1AD70E57404E445F784B1F3A402A9AF6C8D20E5740DE757801411F3A403C44E96ACA0E57403FA06BAB2C1F3A40AFD7A8C0C20E5740DD21E2B7191F3A400C64D87CBC0E5740D45ACB460C1F3A40E92F178AB80E574084CDAF4C071F3A40EE5E5C6DB20E57400F3286EDFF1E3A406845123BAB0E5740EC8282BAF81E3A400B13CADE9F0E57402200D7F5EB1E3A406541C9B3990E5740E34ECF90E51E3A40FE3AE6C6940E5740216FC98BE11E3A40C605D664900E5740A0E5A057DD1E3A4037CDBF4F8D0E5740C8DC992AD91E3A4053C39A5D8B0E57400EA84FFED51E3A4088CCE385890E57400E1832F4D51E3A40120722F3870E574027860FE6D61E3A40054E33BC840E574003FCBC33E11E3A407D78CC647F0E5740FB74D97BF31E3A4036F5DAC7790E5740C3D2A726061F3A407D03B206700E574055E1B46D261F3A4060A2BB696A0E5740451A7918391F3A407BC033E0600E574001A573FC581F3A40F96DF6CA590E5740242217896F1F3A402D52BAF2510E5740402369D4871F3A40ED77295F4D0E5740A8B29B36961F3A4044F1F2D74B0E5740D2A77EA39C1F3A4027CFB5F14B0E5740D46B7656A11F3A4028A8E0CD4C0E5740EC426BA9A51F3A40FD641F194E0E5740B409ABCCA91F3A4058A7320A500E57407E2B4B84AF1F3A40FA6F32C3510E5740B0CA6999B61F3A407441EA74520E57402E5A75E0BC1F3A40D13E3980520E5740A37CD1F1C21F3A40A2AAA8F3510E5740BE7C003DC71F3A4011A34EEA500E57404C816553CB1F3A4022F7E2544F0E5740258D6188D21F3A4092D8DAD24C0E57409A902B7BDB1F3A403F2EF0204B0E5740BE347172E41F3A407E85C4DD490E5740D5D66602EE1F3A4024E39DBF490E5740AAB1AAAEF31F3A4053960A114A0E57403B21A2FEF71F3A405CDEF57E4A0E57400E334F8CFA1F3A4034C4E03F4B0E5740986A13B2FD1F3A407F59EBCF4C0E5740291D833503203A40942680DC4E0E5740187A088409203A40A8156248510E5740111BD12214203A4086312E99530E5740FCE235301D203A40532B4353550E5740F64B0BBA21203A406C3BCC91560E57406A929B1F23203A4072F45308580E574095F1C55923203A40CE02E5FB590E574009C26D3223203A40A12293A45C0E57403191134C21203A402C8FB2F8630E57408167BA361A203A40AD6D0B9B6C0E57406D9F083910203A40	2026-09-17 07:22:26.366759+00
44	10	LP-NAMA-001	No.1 Nowapara	\N	\N	0.80	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Occupied", "Used_Image": "Google Earth"}	{}	0103000020E61000000100000005000000AF97C89DDBB05640F34983DE91783A40C8346A05D2B05640FD1B80C08F783A40990CCC9DD2B05640AE62DC90B2783A409B6851BEDBB056408AC83CF1B2783A40AF97C89DDBB05640F34983DE91783A40	2026-09-17 07:27:11.951342+00
39	8	LP-NAKH-006	Nakhola Grant	\N	\N	11.78	Inner Road	General	Government Land Bank	{"Id": 0, "Plot_Name": "Nakhola Grant", "Plot_Vacan": "Inner Road", "Used_Image": "Google Earth"}	{}	0103000020E610000004000000CB000000A6C481CBDF0E5740C57E8AB1891F3A405618E984E00E57401B396DCA7D1F3A40ECFE1DDCE00E5740FA4C6A53741F3A406A04D4A7E00E574004AD5BA66C1F3A4068203D3CE00E57406EB1E17F641F3A40C90789CADE0E57407BCB75E05C1F3A404203D5ABDC0E5740FD805F97541F3A40F6CABC1BD90E5740A3D382E74B1F3A404D6F4171D30E57403982D8B63C1F3A401EA0B404CD0E5740D969D31D2D1F3A40CC9392C8C70E57403E864A801F1F3A409EFDFE7DC20E574001F92341131F3A40858AD90FBE0E574097DF98BE0A1F3A40163DB384B70E5740F4B562FE011F3A40DA443852AE0E5740F7F10603F81E3A40DB7CDCD3A50E574006D7C9A1EE1E3A407816A1699A0E574001DEE40EE21E3A40EE16FB2A950E57403C754F82DA1E3A40526E51E48E0E5740F9FC8EEAD31E3A40CDC6B2E2880E5740F73FAC1CCE1E3A40B38FD5D1870E5740AD383021C31E3A40D733529F870E5740B9211780BE1E3A40C2CAEC6E850E574058462691B71E3A40AE1084E6850E574042F1DE84C31E3A40596624E4850E5740C76CB727C91E3A40AB6051E0850E5740FE144D3CD21E3A405CE90C77800E57405C358569E71E3A40310CCD92770E5740C65D4BB7031F3A409FFACEC36E0E5740219C9D36221F3A4069B1E5555F0E5740745DEE0A531F3A404E91360D550E5740EFEE5722721F3A40BD3D13AE4C0E574005A4CF728E1F3A40B9F40473490E574034D8E6D79B1F3A4058F566F4430E57401AA062D3AE1F3A4094E0CAFD400E57402E10B0D7B71F3A40756337573F0E5740397689AFB91F3A40223DA1023D0E574082BE490FB31F3A40EF4A71823A0E5740DE84218DAA1F3A40709FDAEC370E57405D528B29A01F3A401D020007360E57408E11002C9A1F3A40502C4ED2320E574036E27989981F3A4082FB3521300E57403748B8AB9A1F3A40336B6A9B2B0E57408FC6E3B6A21F3A40F889000B280E5740A822E8F5A71F3A408A3A92C7250E5740BBD11D3CAD1F3A40119BA9A3240E57409E91D309B51F3A40F860E23E230E57401DF00AC4B81F3A40A98BC66B210E5740C47F11EBBA1F3A4084F135631E0E5740BEA0CAE9B91F3A40BEDD61021B0E5740CF3BF5A5B71F3A40B2585C1C170E5740BFAD3C5FB51F3A40C921652A140E5740F316F46DB31F3A40030717A8110E5740579E47EEAF1F3A401462D5B4100E57407828E3B7AD1F3A40BF2825BB0C0E57407C05AB7DA51F3A4005B6AD32070E57403446D6599B1F3A406CFA9442040E5740E3A05206951F3A40D41BAEC2010E57404F32CAE38B1F3A401796C8FFFE0D5740A9B848B0831F3A40965CF2D6FC0D5740BD51B9A17E1F3A4030A011F3F80D5740A12B6D58771F3A403548DA7CF50D5740D51F1C33731F3A402BD81932F20D5740EA61DB3F711F3A404786278EEE0D5740A238253B701F3A4003D69F05EE0D57408AFF38E96F1F3A405652B863EC0D5740CEFA76EE6E1F3A40E8D77787EB0D5740A99297D76A1F3A405F5FCE5CEB0D57404F5593C4661F3A4053858B1BEB0D5740A8F08CA1631F3A40BC54C3FBE90D5740D11956BA611F3A40141C4950EA0D5740FE2051C16B1F3A4068B47948EA0D57402B65A4106E1F3A4056F7E136EA0D57404EBC9F44731F3A4048603EC4E70D574005A11F1D7F1F3A40C84E7F70E60D5740EFBB039B841F3A40207D078CE40D57400E300128901F3A403736194BDE0D574020CA04BF8B1F3A4019A77411DE0D57406B84FEC2761F3A40015426D4DE0D574075ABA5B24E1F3A405B7EDFB3DF0D5740C36F6BA54A1F3A4093991E01E10D57408F33570C4A1F3A40C9EC7736E40D57404423301E4A1F3A400820BD1CE80D57404A81ADC44B1F3A40BE31C12CFC0D57400319561A391F3A4033D5A0BFFB0D574057F2B7B5341F3A402C1266D1E80D57402B4DE794441F3A4008231323E40D5740E0E6638A431F3A4055F0ACF9DF0D57407FFB1323431F3A40F1C060A1DD0D5740B9D32747451F3A40FBF0B7A9DC0D574096B6F3654D1F3A40A5E65D74DC0D57406564905F621F3A40478C8476DC0D5740B7E0B957911F3A404BE1E176F20D57400F8F7739A01F3A40FF6FA9B3030E5740967FF6DEAB1F3A40EAC5B3C1160E57409EB686BFB91F3A40D4A41FA2200E57407080F548BF1F3A40730E5DE3220E5740204A5C2DBF1F3A40B693E87E240E57404482362DBD1F3A40B82644CE240E5740691CEB44B91F3A400D145729260E5740F988CD40B21F3A4010210D8E270E5740A9E9A9AEAE1F3A402798C71E2A0E574076E59A5AAA1F3A40930478132D0E574081679FE0A51F3A40FCFE803F2F0E5740AE02596BA31F3A4067814E4A310E574047C445CDA01F3A4085C6F206330E5740321412469F1F3A409289CC53340E5740452B6B9D9F1F3A4015C08CC1350E5740196CF5E5A01F3A405501A370370E574042A46F29A51F3A40702AB2FD380E574052FA0F25AB1F3A40F1440F113A0E5740D82D942DB01F3A405C7C8ECC3A0E5740E49E1203B31F3A4012FF2C163D0E57404326ED52B91F3A402CA54D093E0E5740B27275D9BB1F3A40D4095C3F3F0E57405B5B0899BD1F3A40589193AD400E5740796003C9BD1F3A40EB931E33420E5740C0FF2050BB1F3A405B2C083F430E574057BC0EBCB71F3A404915378F450E57409A4C158CAE1F3A4074E6FF0A480E574017EA023EA71F3A40AD48DCEA490E57400A22382DA11F3A407775F6814B0E57402B2A56AAA91F3A4019236A714E0E5740EF2B8D8EB11F3A4080176BA54F0E57406EC89028B81F3A402F761828500E574056DF6F1EBE1F3A40F9F70A3C500E574095DD9971C31F3A402FCE8A444F0E5740E1184A40CB1F3A409316AF844B0E57406BC609B2D71F3A40E7AC85C5490E57401D83422CDF1F3A40A78117F9480E574056637B1DEA1F3A4063FE9AE8470E57409170017FF81F3A40BC762C1C470E5740C9143A7003203A40E5AD9794460E574019C8321009203A4038E5C29B450E5740902B760014203A40010E51D1440E574075F94F3F1A203A40ED8239A2420E5740C7673DE823203A408E5C1E3C410E57400AAE0DC42A203A40D1AD8AAA3F0E57405377CD6D2F203A40E5ECA2BF3D0E57400937445635203A40C9BFDA2E3C0E574031C3101F38203A404E6F161B380E57404D2105F938203A409EE66A8E300E5740214EE5F03B203A405BCABAD42A0E57409FA8DF113D203A401DDBF224280E574025FF86123C203A402CD83CF0240E57407986FB6F3A203A40A37DA5A3230E5740FB374F7839203A40110596B7230E5740F45479CB3E203A40946579372A0E574001FCB97041203A407EF87810330E5740E250DA1040203A40529D30213D0E5740B6CD8B863C203A40193C90D23F0E57404103F9C339203A4006A0175F400E5740D10B729237203A4058A5D245410E5740D3CD482A3B203A409FC3876E420E574003794D3C42203A40E1F6F3D2420E5740C3B4845C46203A40C677AB37450E5740508D8C5345203A40D37E6480450E5740CDAAF33145203A4086BF787F440E5740E97B0A403E203A403B0356DC420E57405A03C9F337203A4009944201420E5740E2A7850B31203A405B7217C1430E5740717B840028203A4019BDE906460E57409B936F171D203A400E7AB0E7460E574092C2E78816203A40F62A1FB4470E5740CD2DAF970B203A403D08097E480E5740AFD7769906203A4031550547490E5740058159CC03203A40D966CE184B0E5740D953DFC604203A40C09F23C54D0E574054F048EA0D203A40395136F5500E57409A434D821A203A4005BB26AE520E574015F97FBF21203A40F21346E1550E57409C77E02327203A407F982D0A5A0E574042709CCB28203A40DCB0CCA35E0E57408543AC6326203A40F60CA796650E57409F3768A61F203A4037C894AC6C0E574062E6521517203A4055EDF29B750E5740644D744E0C203A408E9D0CD27F0E5740E59EA605FF1F3A4071382DC0870E574096ADC89FF41F3A403B27ED688F0E574049E46638EA1F3A40AF1EA724960E574077CA5289E21F3A40831160369F0E5740AA095293D71F3A408D2101B7A80E57401D39C1D1CC1F3A4085C9C180AF0E5740A13CB3BEC41F3A40697CE9D2B40E574001EECDFCBE1F3A40A2B588C3B90E5740B5B45033BA1F3A4042B61665C20E574088F72EF8B11F3A40C6630F97C70E57400DEFFCC6B61F3A405222FD30CC0E5740BC4CD533BA1F3A40A65E662ACD0E57402F728E01BB1F3A40EC02148DD10E5740561BE9D6BD1F3A40865149ABD50E574023B9B083BE1F3A400B57C4ABD40E5740C6154B2ACF1F3A40ADEA1078D60E57403EF2D611CF1F3A40F22B3468D60E574017714140CB1F3A4013373578D60E5740CF4BFB29C61F3A403434C9DBD60E57401D39164DC01F3A403CE9D2BBD70E57408006596DBB1F3A4049B9817AD90E57408B818C01B51F3A4071E7F21CDB0E57406513C0C1AF1F3A4060C42BB2DC0E57403B38DDF0A81F3A40E6AA4890DE0E5740CB4734B7991F3A402607CA9DDF0E5740BADEB3A58B1F3A40A6C481CBDF0E5740C57E8AB1891F3A40600000008C1C88ADC80E5740685DB973B41F3A40F935DC96C10E5740BA817773AD1F3A40EC30B2F0C00E5740913284A7AC1F3A40A4949826BF0E57404C0B0934AD1F3A40E171F485BD0E57405FBAA325AE1F3A40A511A3AEBB0E57406AA11121AD1F3A40BA4F4B63BA0E5740B68BFA2FA91F3A40D98CE39CB80E574091B00BEEA01F3A40BAAF4D01B50E5740BC53F790921F3A403B96DA84AD0E57404E5435A3751F3A400036EEF8A70E574007E8ABCB5F1F3A40339D9700A70E574078F6A5725C1F3A4003902C92A60E5740D9E594115B1F3A40D751C47BB00E5740651192883D1F3A4049B9A05AAF0E5740BD33AC39381F3A40437B83B8AD0E5740CF8E0BB13C1F3A4003011213A70E5740A557697D511F3A401FBFB613A40E57403372389A5B1F3A4071572A659C0E574076E4B0E6731F3A4006AA5C9A940E57402FF4215F8D1F3A408EC4BA36890E57407DA808E6B21F3A406EBEE54F810E5740E28F1BF4CC1F3A40626505317C0E574051BD1CB2DC1F3A405E58AFD9730E5740802B8843FA1F3A406C1AABC86E0E5740A799CD010A203A40AD6D0B9B6C0E57406D9F083910203A402C8FB2F8630E57408067BA361A203A40A12293A45C0E57403191134C21203A40CE02E5FB590E574009C26D3223203A4072F45308580E574095F1C55923203A406C3BCC91560E57406A929B1F23203A40552B4353550E5740F64B0BBA21203A4086312E99530E5740FCE235301D203A40A9156248510E5740111BD12214203A40962680DC4E0E5740177A088409203A407F59EBCF4C0E5740291D833503203A4034C4E03F4B0E5740986A13B2FD1F3A405CDEF57E4A0E57400E334F8CFA1F3A4053960A114A0E57403B21A2FEF71F3A4024E39DBF490E5740AAB1AAAEF31F3A407E85C4DD490E5740D4D66602EE1F3A403F2EF0204B0E5740BE347172E41F3A4092D8DAD24C0E574099902B7BDB1F3A4022F7E2544F0E5740258D6188D21F3A4011A34EEA500E57404B816553CB1F3A40A2AAA8F3510E5740BE7C003DC71F3A40D23E3980520E5740A37CD1F1C21F3A407441EA74520E57402E5A75E0BC1F3A40FA6F32C3510E5740B0CA6999B61F3A4058A7320A500E57407D2B4B84AF1F3A40FD641F194E0E5740B409ABCCA91F3A4028A8E0CD4C0E5740EC426BA9A51F3A4027CFB5F14B0E5740D46B7656A11F3A4044F1F2D74B0E5740D2A77EA39C1F3A40ED77295F4D0E5740A7B29B36961F3A402D52BAF2510E5740412369D4871F3A40F96DF6CA590E5740222217896F1F3A407BC033E0600E574001A573FC581F3A4061A2BB696A0E5740471A7918391F3A407F03B206700E574055E1B46D261F3A4036F5DAC7790E5740C3D2A726061F3A407F78CC647F0E5740FA74D97BF31E3A40064E33BC840E574003FCBC33E11E3A40120722F3870E574027860FE6D61E3A4088CCE385890E57400E1832F4D51E3A4053C39A5D8B0E57400DA84FFED51E3A4037CDBF4F8D0E5740C8DC992AD91E3A40C605D664900E5740A0E5A057DD1E3A40FE3AE6C6940E5740216FC98BE11E3A406541C9B3990E5740E34ECF90E51E3A400B13CADE9F0E57402200D7F5EB1E3A406945123BAB0E5740EC8282BAF81E3A40EE5E5C6DB20E57401E3286EDFF1E3A40E92F178AB80E574084CDAF4C071F3A400C64D87CBC0E5740D55ACB460C1F3A40AFD7A8C0C20E5740DD21E2B7191F3A403C44E96ACA0E57403EA06BAB2C1F3A402A9AF6C8D20E5740DE757801411F3A401B668E1AD70E57404F445F784B1F3A408CEA3AE9D90E57408B051C2F521F3A40C0ED5E1FDC0E5740CC2E7EB0581F3A405D72595CDD0E5740BCA7DCCD5D1F3A40231E0F1EDF0E5740687E0139641F3A40F2CA7B4BDF0E57408FD6BD37681F3A40E97BD199DF0E5740FA2D72F7731F3A40EBC204B6DE0E5740F256BCD7811F3A40D89B8E9ADD0E5740B54B0A1B901F3A4016D2070DDD0E5740DCF071BF961F3A406DD22084DB0E5740625E8148A11F3A400C9E3643D70E5740A3E18B3DB11F3A408824F2BBD50E57408927A0DCB71F3A406F44CC14D50E57406BE9DD69B91F3A40C05239C1D40E57409FC57C30BA1F3A40B03BF412D30E5740D7B6838BBA1F3A402666FB7FCF0E57403EB518B5B81F3A408C1C88ADC80E5740685DB973B41F3A4018000000EF950615A00E5740DBE36500731F3A40D71983BFA50E5740590C311E611F3A40912B6F03A80E5740B50E05D2671F3A4097BDA956AF0E5740B42769C4831F3A40257FD5CBB50E5740FE4222E49F1F3A40B0AB1101B80E57403272A38CA81F3A400D3E6D52B80E5740E0ACB00EAD1F3A40CE5CA118B80E5740816A4588B21F3A4034B81FD8B60E5740B9B921D5B51F3A40D9EE1472B20E5740104AC705BB1F3A4019D878A0AA0E574024E67FA9C31F3A403C2047EAA20E574060D52E16CD1F3A401D2EA20D980E5740F556AD8DDA1F3A40A49739888A0E5740DF82A01DEA1F3A405BB7241A800E57409468E191F81F3A40E097D176770E5740659DD5E804203A404D11D971700E574007385A270D203A40B7016A83700E57403EA0D3FA0C203A40069835BF750E574098281080FA1F3A40E9D4813F7E0E5740F1F55180DE1F3A4071752279890E57407BF213F3B91F3A400FCFEE848F0E57400689D0AEA71F3A40F71149D6980E57405A663E5A891F3A40EF950615A00E5740DBE36500731F3A401A000000BE15E4CAE50D57409991E50F921F3A406D218F04E70D5740B3F13C538B1F3A40ADCC23D6E80D5740C578B858821F3A4054A9257AEA0D57409771A01E7C1F3A401DC7B0D6EB0D5740778F7EE3761F3A40607512B1EC0D5740873F9429741F3A4039737B2DF00D574020C894FA741F3A4068DBCAB5F20D57408E1D86C8741F3A40B201C9DDF60D57402B017A81781F3A40030A857FFA0D574092D6CBB87E1F3A406D3E9FB5FC0D57405CE7B5E7831F3A40BEC3D292FE0D5740EEE7D254891F3A40F034399C010E5740306C80CA921F3A400D090079030E5740B4CB1D38991F3A40468F2971050E574024366CE59D1F3A405500159F070E5740BD345073A11F3A40913805FC0D0E5740A34D841CAD1F3A40C8D03AEE090E57407DF7AF64AA1F3A4056DE0F1C040E57408FD57782A61F3A40C4362704FF0D57408DB38724A31F3A40B8D2AE21FA0D5740B40B8C679F1F3A40FA5CA73DF40D57401B7907C59B1F3A40A6A9065BEF0D5740B9873668981F3A40911CE54BEA0D5740E8768C4A951F3A407F3B297CE60D5740963522D4921F3A40BE15E4CAE50D57409991E50F921F3A40	2026-09-17 07:22:26.368849+00
40	8	LP-NAKH-007	Nakhola Grant	\N	\N	1.96	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Nakhola Grant", "Plot_Vacan": "Doubtful", "Used_Image": "Google Earth"}	{}	0103000020E61000000100000036000000AC519BDD870E5740EEF65D45BF1E3A40D733529F870E5740B9211780BE1E3A40B38FD5D1870E5740AD383021C31E3A40CDC6B2E2880E5740F83FAC1CCE1E3A40526E51E48E0E5740F9FC8EEAD31E3A40EE16FB2A950E57403B754F82DA1E3A407816A1699A0E574001DEE40EE21E3A40DB7CDCD3A50E574006D7C9A1EE1E3A40DA443852AE0E5740F6F10603F81E3A40163DB384B70E5740F4B562FE011F3A40858AD90FBE0E574098DF98BE0A1F3A409EFDFE7DC20E574001F92341131F3A40CC9392C8C70E57403E864A801F1F3A401EA0B404CD0E5740D969D31D2D1F3A404D6F4171D30E57403982D8B63C1F3A40F6CABC1BD90E5740A3D382E74B1F3A404203D5ABDC0E5740FC805F97541F3A40C90789CADE0E57407CCB75E05C1F3A4068203D3CE00E57406DB1E17F641F3A406A04D4A7E00E574005AD5BA66C1F3A40ECFE1DDCE00E5740FA4C6A53741F3A405618E984E00E57401B396DCA7D1F3A40A8C481CBDF0E5740BC7E8AB1891F3A402607CA9DDF0E5740B8DEB3A58B1F3A40E6AA4890DE0E5740CB4734B7991F3A4060C42BB2DC0E57403B38DDF0A81F3A4071E7F21CDB0E57406513C0C1AF1F3A4049B9817AD90E57408A818C01B51F3A403CE9D2BBD70E57408206596DBB1F3A403434C9DBD60E57401C39164DC01F3A4013373578D60E5740CF4BFB29C61F3A40F22B3468D60E574019714140CB1F3A40ADEA1078D60E57403EF2D611CF1F3A40F626C038DA0E57401F55CCDECE1F3A408F2E97ADDA0E5740200FED2CCE1F3A4001608601DB0E57407DA7DE89CC1F3A40D2499CC5DC0E574032575D78C61F3A4012956DD3DC0E5740CDCC51F9BF1F3A4037CF2815DF0E5740E6CD4D27A41F3A4014921EA3E30E5740213B36EC6D1F3A401386AA14E40E5740ECB17DD3671F3A401D0392A7E30E5740CC81D546631F3A4035BC05CEE00E5740C05698035C1F3A404253597BDE0E57408EA791E9551F3A40FB6ADD76D30E57405293F3F8381F3A40B1DEEC9BC50E5740F5B8BAA1121F3A40C8DB6E32B30E574096FE5D90F91E3A40D65DD2C9AB0E574010E06FE3F01E3A401740084CA20E5740D351962BE91E3A403ACE9752A00E57404660EE7FE71E3A400A11898E9E0E5740A7A14995E51E3A4017019DE0950E57407353653DD51E3A40CE4FF0F48D0E5740C2ECFC8AC71E3A40AC519BDD870E5740EEF65D45BF1E3A40	2026-09-17 07:22:26.370222+00
41	9	LP-NALT-001	Naltali	\N	\N	5.08	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Naltali", "Plot_Vacan": "Doubtful", "Used_Image": "Google Earth"}	{}	0103000020E610000001000000310000000C3E9FC245385740C0C84A70D68F3A40C49FA89648385740804704BEC78F3A400489360649385740405564C9C58F3A40D0AE48094B385740608423B5C98F3A4098870F474F385740A0866AB9D28F3A4014D8CCA0533857404054FA2CDA8F3A406C25971B57385740B08D9530E38F3A4014205C4C5C385740E0D2F60AEF8F3A403C75CF9C5D385740D08285E7E98F3A402074CD665F385740B020C2BBE08F3A40A08BC9295E38574020329927DA8F3A4040822A935A385740907FB5BFD08F3A40B8A2927157385740506BF7DFC68F3A401C1677185538574090D97E2DBE8F3A409CE230A953385740901B03D5B78F3A4008DE418251385740603977AAAE8F3A40D4EE33CA4D385740A04B907EA58F3A40D41735874A38574020FA91629B8F3A40182B31B94738574010AB1683918F3A40EC17599D463857401042F6478D8F3A40F8E4CEC746385740800D317F8B8F3A40E8FD1F5B4738574060BBDCED878F3A409088516B48385740205D501C838F3A40D49AB10E4A385740F00576BA7C8F3A40189F7B424B38574060177BC9788F3A4084857F744D385740D076F217728F3A40687A6AF34C38574090663A966F8F3A406C8B72F24A385740004CC4F7758F3A40BC2D64D949385740D0C2E6087A8F3A4058824303493857404042AFF97C8F3A40485D896B48385740908AA5DA7F8F3A409C2AB72E47385740502E7E8C858F3A4074670A8E463857401045AEED888F3A40343DAB0C46385740302E2CBE8A8F3A40D4B9399D45385740208AF40D8B8F3A4098D7702045385740E0D077ED8A8F3A4040321E4F4438574000779AAB888F3A4020A150C74238574080C831A7828F3A40D89C2CB14038574020D62670788F3A40C81ACCA73E3857406015FDA3708F3A40D4BBF6A93D385740607E89896D8F3A400029032B3D385740106093806C8F3A40C023CC793A385740E0C8FDCA758F3A400C54EC4038385740D031C4FD7E8F3A401C24FA4A3638574020C23010878F3A40A4E48FE134385740D0E508128D8F3A4070B989DD3938574020796ACD9A8F3A40E46CEBF83638574000E0F676AE8F3A400C3E9FC245385740C0C84A70D68F3A40	2026-09-17 07:23:21.209543+00
50	10	LP-NAMA-007	No.1 Nowapara	\N	\N	7.39	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Occupied", "Used_Image": "Google Earth"}	{}	0103000020E6100000010000000A000000C0183BC507B1564041883C8B38793A40D0DC5AF7E8B05640409101C82A793A402296E043E7B056409483DFFC52793A40EFE69255E5B056406132F89F80793A4076D8EFAFEFB0564024FF383E86793A40C082988EF3B056408EC2CD5788793A4078F714BCF8B056403B7C11278B793A4024E38E3D07B15640478D170693793A4082810B0B08B1564052AFFDED92793A40C0183BC507B1564041883C8B38793A40	2026-09-17 07:27:11.958747+00
51	10	LP-NAMA-008	No.1 Nowapara	\N	\N	2.65	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Occupied", "Used_Image": "Google Earth"}	{}	0103000020E610000001000000060000000656620108B15640A59FD09605793A40E945A9C8F0B056404ACE181FFC783A405F9CA93FEFB05640B49E419C27793A402A0A8FF4F9B056400304E95D2B793A401D3253CD07B156401FBC07B031793A400656620108B15640A59FD09605793A40	2026-09-17 07:27:11.960185+00
52	10	LP-NAMA-009	No.1 Nowapara	\N	\N	9.68	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Doubtful", "Used_Image": "Google Earth"}	{}	0103000020E610000001000000270000000656620108B15640A49FD09605793A400FBF880208B15640337C6B9D04793A407CDF4B9608B15640ADB6F79DD0783A40446B402409B15640ABA50450A1783A4001252E5109B15640756D4A4E8D783A40CD267E3FFEB056400C99F24A91783A40D6CA9EDBF5B05640979678DA95783A407D1DD62EE9B05640ADCAECB394783A409780A121E9B0564004E1B9B294783A40DC764064E8B05640C74AF53CA9783A40BF9B699AE7B0564006951435BA783A402E8B3431E8B056405E5D3A01BC783A40D4DB44C7EFB05640E2DE7164C0783A4004C973C5F8B0564071F1A70AC6783A409B99B2EAFDB056400BC3627EC9783A4007301135FFB056405E2F2950CC783A407E20C375FFB056405A98C43DD0783A407AF43E5CFFB056401AD1E79FD9783A40256CD851FFB056409AB59908E2783A4012D95AD3FEB05640212F9553EE783A402ECB8F7BFEB056407A7C7CD3F1783A40ED9FDB0AFEB05640436CE5F8F2783A40FE85E233FCB0564066C893AEF3783A40A9B03224FAB05640423432FDF3783A408C02BCBEF5B05640ADCC66EEF2783A40306DC728F0B0564079180FA0F0783A4026131054E7B05640BDD37C2EEB783A40B39198BEDDB0564056482E20E4783A4032A62273D7B056409BFEA25CE2783A400C1EC217D7B056408803C961E5783A401B31CAAAD6B056409BFEAFBEEE783A40CBFDA649D6B056400CA4760505793A40B7B72D57D6B056401231E69010793A40283C086AD6B056400847F5CE17793A40ABA73F19D7B05640D5D5BA591C793A407096DCE6E7B056409B3B570825793A405F9CA93FEFB05640B49E419C27793A40E945A9C8F0B056404ACE181FFC783A400656620108B15640A49FD09605793A40	2026-09-17 07:27:11.961474+00
53	10	LP-NAMA-010	No.1 Nowapara	\N	\N	3.29	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Doubtful", "Used_Image": "Google Earth"}	{}	0103000020E6100000010000000B0000006378CEEF2CB156401ACA956D6C793A405214DB601BB15640C944059963793A40D11F0EEE1AB15640BD7DDA3A70793A40009C7E2A19B156407E3DC9EAA1793A40366D7D1D19B15640E3F66270A3793A40F46EB2552FB15640201D2222AE793A40F9404D1F2FB15640BDEDAFD2A5793A4029E3647F2EB1564013B8799D89793A40FAC2F6AC2DB15640233C6CC87F793A40A24F92762DB156408A11A8377A793A406378CEEF2CB156401ACA956D6C793A40	2026-09-17 07:27:11.962561+00
54	10	LP-NAMA-011	No.1 Nowapara	\N	\N	1.10	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Doubtful", "Used_Image": "Google Earth"}	{}	0103000020E61000000100000006000000CAF8439627B15640804B8767AA793A40866225C525B15640B7BB138AD8793A4094CBADEB30B15640941F68AADC793A4091778ADA2FB15640F578C36DC2793A40F46EB2552FB15640201D2222AE793A40CAF8439627B15640804B8767AA793A40	2026-09-17 07:27:11.963538+00
55	10	LP-NAMA-012	No.1 Nowapara	\N	\N	1.63	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Doubtful", "Used_Image": "Google Earth"}	{}	0103000020E61000000100000006000000F0B7DCC226B15640CFDBC701AA793A40366D7D1D19B15640E3F66270A3793A40F747238A17B15640C77D28A4D2793A40ACAB9CB224B1564049444B18D8793A4064B43F3725B1564043871C98D4793A40F0B7DCC226B15640CFDBC701AA793A40	2026-09-17 07:27:11.964371+00
56	10	LP-NAMA-013	No.1 Nowapara	\N	\N	6.94	Inner Road	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Inner Road", "Used_Image": "Google Earth"}	{}	0103000020E61000000300000067000000021D8A2725B1564005F4640E237A3A4030245D8F25B1564079B1B309E0793A40CAFAF82131B15640D21D85E1E1793A4094CBADEB30B15640941F68AADC793A40866225C525B15640B7BB138AD8793A40CAF8439627B15640804B8767AA793A40F0B7DCC226B15640CFDBC701AA793A4064B43F3725B1564043871C98D4793A40ACAB9CB224B1564048444B18D8793A40F747238A17B15640C77D28A4D2793A40009C7E2A19B156407F3DC9EAA1793A40D5B64AC81BB15640BEFE4D3758793A4070051B251DB15640D493F21928793A40665B73681CB15640EB6968AA1E793A401C68AA841AB15640FBA1A21D19793A40F7933E220AB156407E188E0310793A40F69AFB330BB156408CD762A08C783A4001252E5109B15640756D4A4E8D783A40446B402409B15640ABA50450A1783A407CDF4B9608B15640ADB6F79DD0783A400FBF880208B15640337C6B9D04793A401D3253CD07B156401FBC07B031793A402A0A8FF4F9B056400304E95D2B793A407096DCE6E7B056409B3B570825793A40ABA73F19D7B05640D5D5BA591C793A40283C086AD6B056400947F5CE17793A40B7B72D57D6B056401231E69010793A40CBFDA649D6B056400BA4760505793A401B31CAAAD6B056409BFEAFBEEE783A400C1EC217D7B056408803C961E5783A4032A62273D7B056409CFEA25CE2783A40B39198BEDDB0564056482E20E4783A4026131054E7B05640BCD37C2EEB783A40306DC728F0B0564079180FA0F0783A408C02BCBEF5B05640ADCC66EEF2783A40A9B03224FAB05640423432FDF3783A40FE85E233FCB0564066C893AEF3783A40ED9FDB0AFEB05640436CE5F8F2783A402ECB8F7BFEB056407A7C7CD3F1783A4012D95AD3FEB05640222F9553EE783A40256CD851FFB056409AB59908E2783A407AF43E5CFFB056401AD1E79FD9783A407E20C375FFB056405A98C43DD0783A4007301135FFB056405F2F2950CC783A409B99B2EAFDB056400DC3627EC9783A4004C973C5F8B0564071F1A70AC6783A40D4DB44C7EFB05640E1DE7164C0783A402E8B3431E8B056405E5D3A01BC783A40BF9B699AE7B0564007951435BA783A40DC764064E8B05640C74AF53CA9783A409780A121E9B0564003E1B9B294783A40471712F4E7B056404629599794783A40364E8D61E6B05640AA51E580B9783A407B6BE3DAE5B0564079F0D468BA783A40D2A496F7DAB05640AFFB8598B5783A4086F90AA3D9B056409788379BB5783A40E461E2E0D8B05640FEFA3B07B6783A406357EF0ED8B0564032AB0B6BB8783A4051EE2D7DD7B056402B94B3E3BC783A40C693A8E6D6B05640F6C59635C5783A4005626B59D6B05640C54D5DD1D0783A400CA48F33D6B05640032793D2D9783A40CF1D6731D6B056400CC046F5E0783A405CCF042CD6B056409FE5123BE2783A40F1A3D3B9D5B056408B450739FD783A40C8D13A89D5B05640133E717E12793A4091B0A9A2D5B05640A64D96EA18793A4068243AAFD5B05640852B7CBE20793A40B5BF6BA3E7B05640F052A4B129793A407156E7A0E7B056402B074BBA2B793A4070A9D707E7B05640F2C1FC7E3B793A40094C905AE5B05640F613E8A05B793A4015F7E9CCE3B05640D8835D2D7D793A4003170EF5E2B05640187F6CB892793A40A15177B8E0B0564015ED12B8C3793A405286C0DEDEB05640DC81BEC2EC793A40A5D56392DEB0564018FA4B7DF6793A4015E14EBEDEB05640B8618678F6793A40D5BC41ECDFB0564081B5E639F7793A40DC00B00AE5B056403FD8E32D87793A40AF1EF0BA07B15640893D8EA099793A40A8D8A35909B1564066C179C1117A3A4028B6FA140AB156407C487039127A3A401E2758C90AB15640FC2164AB127A3A4069A0A6AA09B15640349498BD94793A401C6928A909B156405A786BBD92793A400655037009B15640D8A4AC2A46793A40C6E8CE5209B156409A8FDA3C39793A4090D5DC4409B1564085C4601033793A405142126809B156405C43409716793A408FF3FBD20DB1564032A748FF19793A402045CB7513B15640D9D6B32A1D793A408DD5297417B156402D700D5B1E793A40B77BD1641AB15640526164AB21793A40D7851E6D1BB1564010F3CCEC23793A40CF687AD31BB1564009CB11262B793A40887D46761AB15640BB8786935B793A40E8458BC417B15640FA930265A3793A408EBB12E615B15640AAD5FF58D0793A40533556DE15B15640F369019BD6793A4077BA061724B1564015918961DE793A406C3FD2D523B156406A081C4B227A3A40021D8A2725B1564005F4640E237A3A400600000082810B0B08B1564052AFFDED92793A4024E38E3D07B15640478D170693793A40EFE69255E5B056406132F89F80793A40D0DC5AF7E8B05640409101C82A793A40C0183BC507B1564041883C8B38793A4082810B0B08B1564052AFFDED92793A4019000000C263A0C1E2B05640D7B16A81E1783A409963D444D9B056408915A6FFDC783A4064AD1CCDD7B05640F1442D1ADD783A4004126CFFD6B05640A65D2D4BDC783A401A65B1F3D6B05640CF68EAF0D8783A407A1A43F9D6B05640C8E37971D4783A407BDF7C2AD7B05640D1A12664CE783A40769B5688D7B05640FA84B000C6783A40DB9D442AD8B056404C38F6CDBE783A4040F568E3D8B05640A9952A54BB783A4012A689EED9B0564022CFF90BB9783A40171822A5DCB05640B6F1BDCDB9783A4068814F4AE4B05640660B8E37BD783A40B426E7CCEEB05640B8DF73BEC3783A405EE93472F8B0564092500E3DC9783A4047871160FDB0564005A63D7BCC783A4080A86365FEB05640128589E4CE783A400EECD188FEB05640F563C7FCD3783A40180B648AFEB05640DE87D8F6DD783A408C733E2EFEB05640309EE0FBE4783A4051E1720AFEB05640B635346EEB783A40B3450D98FDB05640E36D0DF2ED783A40592D7880FCB056403C3E030DEF783A409C44EB15F0B056406BC8FF61E9783A40C263A0C1E2B05640D7B16A81E1783A40	2026-09-17 07:27:11.965182+00
57	10	LP-NAMA-014	No.1 Nowapara	\N	\N	0.87	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Occupied", "Used_Image": "Google Earth"}	{}	0103000020E610000001000000090000004F73620012B156408F8D2A60FB783A409954A1550AB15640E129CF59F7783A4067698F4D0AB1564088475F39FB783A40A82097480AB15640CAF6049CFD783A40F7933E220AB1564087188E0310793A40EF40F37510B156404ABF588713793A40798FED6C17B156401FC3D16517793A404C8FCC7718B1564066BD29C5FE783A404F73620012B156408F8D2A60FB783A40	2026-09-17 07:27:11.966229+00
58	10	LP-NAMA-015	No.1 Nowapara	\N	\N	0.54	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Occupied", "Used_Image": "Google Earth"}	{}	0103000020E610000001000000090000005F59B0DF21B156401BFBF00219793A40952BF6661EB15640BEAF0B3F06793A40582D20041DB1564084175B2801793A404D8FCC7718B1564061BD29C5FE783A40788FED6C17B1564015C3D16517793A401C68AA841AB15640FBA1A21D19793A40665B73681CB15640EB6968AA1E793A4016E8F2891CB1564026F0515720793A405F59B0DF21B156401BFBF00219793A40	2026-09-17 07:27:11.967104+00
59	10	LP-NAMA-016	No.1 Nowapara	\N	\N	2.22	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Occupied", "Used_Image": "Google Earth"}	{}	0103000020E6100000010000000D0000007263DFBC22B15640C11C84AE1D793A405F59B0DF21B156401BFBF00219793A4016E8F2891CB1564026F0515720793A4070051B251DB15640D493F21928793A408D37A97D1CB156409B88CC323F793A409A67565F1CB1564090E9956143793A40D5B64AC81BB15640BEFE4D3758793A405214DB601BB15640C944059963793A406378CEEF2CB156401ACA956D6C793A401778AACE2CB156406C287D0969793A4069DD6D6C2AB156408558D30551793A4076609BFD25B15640AF681AC035793A407263DFBC22B15640C11C84AE1D793A40	2026-09-17 07:27:11.967882+00
60	11	LP-NO1N-001	No.1 Nowapara	\N	\N	0.80	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Occupied", "Used_Image": "Google Earth"}	{}	0103000020E61000000100000005000000AF97C89DDBB05640F34983DE91783A40C8346A05D2B05640FD1B80C08F783A40990CCC9DD2B05640AE62DC90B2783A409B6851BEDBB056408AC83CF1B2783A40AF97C89DDBB05640F34983DE91783A40	2026-09-17 07:29:30.368726+00
61	11	LP-NO1N-002	No.1 Nowapara	\N	\N	19.43	Vacan	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Vacant", "Used_Image": "Google Earth"}	{}	0103000020E61000000100000023000000A5D56392DEB0564018FA4B7DF6793A405286C0DEDEB05640DC81BEC2EC793A40A05177B8E0B0564015ED12B8C3793A4003170EF5E2B05640187F6CB892793A4015F7E9CCE3B05640D8835D2D7D793A40074C905AE5B05640F613E8A05B793A4070A9D707E7B05640F2C1FC7E3B793A407156E7A0E7B056402B074BBA2B793A40B5BF6BA3E7B05640F052A4B129793A4067243AAFD5B05640852B7CBE20793A4091B0A9A2D5B05640A64D96EA18793A40C8D13A89D5B05640133E717E12793A40F1A3D3B9D5B056408B450739FD783A40CF1D6731D6B056400CC046F5E0783A400CA48F33D6B05640032793D2D9783A4005626B59D6B05640C54D5DD1D0783A40C693A8E6D6B05640F6C59635C5783A4051EE2D7DD7B056402B94B3E3BC783A406357EF0ED8B0564032AB0B6BB8783A40E461E2E0D8B05640FEFA3B07B6783A4086F90AA3D9B056409788379BB5783A40D2A496F7DAB05640AFFB8598B5783A407B6BE3DAE5B0564079F0D468BA783A40364E8D61E6B05640AA51E580B9783A40471712F4E7B056404629599794783A40B197C89DDBB05640F34983DE91783A409B6851BEDBB056408AC83CF1B2783A40990CCC9DD2B05640AE62DC90B2783A40C9346A05D2B05640FD1B80C08F783A402BDF2D54C0B05640D6CDFDD88B783A40A26E0BA6C5B05640912A563FFD783A40C557BCC8CCB05640A0B552B68B793A40AD5E2860D0B056406C393F0ECE793A4093A86953D3B05640A94914B6F7793A40A5D56392DEB0564018FA4B7DF6793A40	2026-09-17 07:29:30.370724+00
62	11	LP-NO1N-003	No.1 Nowapara	\N	\N	11.54	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Occupied", "Used_Image": "Google Earth"}	{}	0103000020E610000001000000130000001E2758C90AB15640FC2164AB127A3A40724ACB1320B15640EFA2D01E207A3A406C3FD2D523B156406A081C4B227A3A4077BA061724B1564015918961DE793A40533556DE15B15640F369019BD6793A408EBB12E615B15640AAD5FF58D0793A40E6458BC417B15640FA930265A3793A40887D46761AB15640BB8786935B793A40CF687AD31BB1564009CB11262B793A40D7851E6D1BB1564010F3CCEC23793A40B77BD1641AB15640526164AB21793A408DD5297417B156402D700D5B1E793A401F45CB7513B15640DAD6B32A1D793A408FF3FBD20DB1564032A748FF19793A405142126809B156405C43409716793A4090D5DC4409B1564085C4601033793A400655037009B15640D8A4AC2A46793A4069A0A6AA09B15640349498BD94793A401E2758C90AB15640FC2164AB127A3A40	2026-09-17 07:29:30.372104+00
63	11	LP-NO1N-004	No.1 Nowapara	\N	\N	3.57	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Occupied", "Used_Image": "Google Earth"}	{}	0103000020E6100000010000001900000004126CFFD6B05640A65D2D4BDC783A4064AD1CCDD7B05640F1442D1ADD783A409963D444D9B056408915A6FFDC783A40C163A0C1E2B05640D7B16A81E1783A409C44EB15F0B056406BC8FF61E9783A40592D7880FCB056403C3E030DEF783A40B3450D98FDB05640E36D0DF2ED783A4051E1720AFEB05640B635346EEB783A408C733E2EFEB05640309EE0FBE4783A40180B648AFEB05640DE87D8F6DD783A400EECD188FEB05640F563C7FCD3783A4080A86365FEB05640128589E4CE783A4047871160FDB0564005A63D7BCC783A405EE93472F8B0564092500E3DC9783A40B426E7CCEEB05640B8DF73BEC3783A4068814F4AE4B05640660B8E37BD783A40171822A5DCB05640B6F1BDCDB9783A4012A689EED9B0564022CFF90BB9783A4040F568E3D8B05640A9952A54BB783A40DB9D442AD8B056404C38F6CDBE783A40769B5688D7B05640FA84B000C6783A407BDF7C2AD7B05640D1A12664CE783A407A1A43F9D6B05640C8E37971D4783A401A65B1F3D6B05640CF68EAF0D8783A4004126CFFD6B05640A65D2D4BDC783A40	2026-09-17 07:29:30.378533+00
64	11	LP-NO1N-005	No.1 Nowapara	\N	\N	2.35	Vacan	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Vacant", "Used_Image": "Google Earth"}	{}	0103000020E61000000100000007000000CAFAF82131B15640D21D85E1E1793A4030245D8F25B1564079B1B309E0793A40021D8A2725B1564005F4640E237A3A40B3D2360B33B156408E5168162B7A3A408908DCB033B1564040AA339C157A3A40AB66B4FD31B156407C6CD8FCF6793A40CAFAF82131B15640D21D85E1E1793A40	2026-09-17 07:29:30.379584+00
65	11	LP-NO1N-006	No.1 Nowapara	\N	\N	11.27	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Occupied", "Used_Image": "Google Earth"}	{}	0103000020E61000000100000009000000CFA2C68BF4B05640E2EFC86C8F793A40DC00B00AE5B056403FD8E32D87793A406958FE07E3B05640493E2630B3793A40D5BC41ECDFB0564081B5E639F7793A40A8D8A35909B1564066C179C1117A3A40884C140C08B15640643CBF21B1793A40AF1EF0BA07B15640893D8EA099793A4050CE0B53FAB0564059977B7F92793A40CFA2C68BF4B05640E2EFC86C8F793A40	2026-09-17 07:29:30.3806+00
66	11	LP-NO1N-007	No.1 Nowapara	\N	\N	7.39	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Occupied", "Used_Image": "Google Earth"}	{}	0103000020E6100000010000000A000000C0183BC507B1564041883C8B38793A40D0DC5AF7E8B05640409101C82A793A402296E043E7B056409483DFFC52793A40EFE69255E5B056406132F89F80793A4076D8EFAFEFB0564024FF383E86793A40C082988EF3B056408EC2CD5788793A4078F714BCF8B056403B7C11278B793A4024E38E3D07B15640478D170693793A4082810B0B08B1564052AFFDED92793A40C0183BC507B1564041883C8B38793A40	2026-09-17 07:29:30.381634+00
67	11	LP-NO1N-008	No.1 Nowapara	\N	\N	2.65	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Occupied", "Used_Image": "Google Earth"}	{}	0103000020E610000001000000060000000656620108B15640A59FD09605793A40E945A9C8F0B056404ACE181FFC783A405F9CA93FEFB05640B49E419C27793A402A0A8FF4F9B056400304E95D2B793A401D3253CD07B156401FBC07B031793A400656620108B15640A59FD09605793A40	2026-09-17 07:29:30.382581+00
68	11	LP-NO1N-009	No.1 Nowapara	\N	\N	9.68	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Doubtful", "Used_Image": "Google Earth"}	{}	0103000020E610000001000000270000000656620108B15640A49FD09605793A400FBF880208B15640337C6B9D04793A407CDF4B9608B15640ADB6F79DD0783A40446B402409B15640ABA50450A1783A4001252E5109B15640756D4A4E8D783A40CD267E3FFEB056400C99F24A91783A40D6CA9EDBF5B05640979678DA95783A407D1DD62EE9B05640ADCAECB394783A409780A121E9B0564004E1B9B294783A40DC764064E8B05640C74AF53CA9783A40BF9B699AE7B0564006951435BA783A402E8B3431E8B056405E5D3A01BC783A40D4DB44C7EFB05640E2DE7164C0783A4004C973C5F8B0564071F1A70AC6783A409B99B2EAFDB056400BC3627EC9783A4007301135FFB056405E2F2950CC783A407E20C375FFB056405A98C43DD0783A407AF43E5CFFB056401AD1E79FD9783A40256CD851FFB056409AB59908E2783A4012D95AD3FEB05640212F9553EE783A402ECB8F7BFEB056407A7C7CD3F1783A40ED9FDB0AFEB05640436CE5F8F2783A40FE85E233FCB0564066C893AEF3783A40A9B03224FAB05640423432FDF3783A408C02BCBEF5B05640ADCC66EEF2783A40306DC728F0B0564079180FA0F0783A4026131054E7B05640BDD37C2EEB783A40B39198BEDDB0564056482E20E4783A4032A62273D7B056409BFEA25CE2783A400C1EC217D7B056408803C961E5783A401B31CAAAD6B056409BFEAFBEEE783A40CBFDA649D6B056400CA4760505793A40B7B72D57D6B056401231E69010793A40283C086AD6B056400847F5CE17793A40ABA73F19D7B05640D5D5BA591C793A407096DCE6E7B056409B3B570825793A405F9CA93FEFB05640B49E419C27793A40E945A9C8F0B056404ACE181FFC783A400656620108B15640A49FD09605793A40	2026-09-17 07:29:30.383537+00
69	11	LP-NO1N-010	No.1 Nowapara	\N	\N	3.29	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Doubtful", "Used_Image": "Google Earth"}	{}	0103000020E6100000010000000B0000006378CEEF2CB156401ACA956D6C793A405214DB601BB15640C944059963793A40D11F0EEE1AB15640BD7DDA3A70793A40009C7E2A19B156407E3DC9EAA1793A40366D7D1D19B15640E3F66270A3793A40F46EB2552FB15640201D2222AE793A40F9404D1F2FB15640BDEDAFD2A5793A4029E3647F2EB1564013B8799D89793A40FAC2F6AC2DB15640233C6CC87F793A40A24F92762DB156408A11A8377A793A406378CEEF2CB156401ACA956D6C793A40	2026-09-17 07:29:30.384573+00
70	11	LP-NO1N-011	No.1 Nowapara	\N	\N	1.10	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Doubtful", "Used_Image": "Google Earth"}	{}	0103000020E61000000100000006000000CAF8439627B15640804B8767AA793A40866225C525B15640B7BB138AD8793A4094CBADEB30B15640941F68AADC793A4091778ADA2FB15640F578C36DC2793A40F46EB2552FB15640201D2222AE793A40CAF8439627B15640804B8767AA793A40	2026-09-17 07:29:30.38552+00
71	11	LP-NO1N-012	No.1 Nowapara	\N	\N	1.63	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Doubtful", "Used_Image": "Google Earth"}	{}	0103000020E61000000100000006000000F0B7DCC226B15640CFDBC701AA793A40366D7D1D19B15640E3F66270A3793A40F747238A17B15640C77D28A4D2793A40ACAB9CB224B1564049444B18D8793A4064B43F3725B1564043871C98D4793A40F0B7DCC226B15640CFDBC701AA793A40	2026-09-17 07:29:30.386655+00
72	11	LP-NO1N-013	No.1 Nowapara	\N	\N	6.94	Inner Road	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Inner Road", "Used_Image": "Google Earth"}	{}	0103000020E61000000300000067000000021D8A2725B1564005F4640E237A3A4030245D8F25B1564079B1B309E0793A40CAFAF82131B15640D21D85E1E1793A4094CBADEB30B15640941F68AADC793A40866225C525B15640B7BB138AD8793A40CAF8439627B15640804B8767AA793A40F0B7DCC226B15640CFDBC701AA793A4064B43F3725B1564043871C98D4793A40ACAB9CB224B1564048444B18D8793A40F747238A17B15640C77D28A4D2793A40009C7E2A19B156407F3DC9EAA1793A40D5B64AC81BB15640BEFE4D3758793A4070051B251DB15640D493F21928793A40665B73681CB15640EB6968AA1E793A401C68AA841AB15640FBA1A21D19793A40F7933E220AB156407E188E0310793A40F69AFB330BB156408CD762A08C783A4001252E5109B15640756D4A4E8D783A40446B402409B15640ABA50450A1783A407CDF4B9608B15640ADB6F79DD0783A400FBF880208B15640337C6B9D04793A401D3253CD07B156401FBC07B031793A402A0A8FF4F9B056400304E95D2B793A407096DCE6E7B056409B3B570825793A40ABA73F19D7B05640D5D5BA591C793A40283C086AD6B056400947F5CE17793A40B7B72D57D6B056401231E69010793A40CBFDA649D6B056400BA4760505793A401B31CAAAD6B056409BFEAFBEEE783A400C1EC217D7B056408803C961E5783A4032A62273D7B056409CFEA25CE2783A40B39198BEDDB0564056482E20E4783A4026131054E7B05640BCD37C2EEB783A40306DC728F0B0564079180FA0F0783A408C02BCBEF5B05640ADCC66EEF2783A40A9B03224FAB05640423432FDF3783A40FE85E233FCB0564066C893AEF3783A40ED9FDB0AFEB05640436CE5F8F2783A402ECB8F7BFEB056407A7C7CD3F1783A4012D95AD3FEB05640222F9553EE783A40256CD851FFB056409AB59908E2783A407AF43E5CFFB056401AD1E79FD9783A407E20C375FFB056405A98C43DD0783A4007301135FFB056405F2F2950CC783A409B99B2EAFDB056400DC3627EC9783A4004C973C5F8B0564071F1A70AC6783A40D4DB44C7EFB05640E1DE7164C0783A402E8B3431E8B056405E5D3A01BC783A40BF9B699AE7B0564007951435BA783A40DC764064E8B05640C74AF53CA9783A409780A121E9B0564003E1B9B294783A40471712F4E7B056404629599794783A40364E8D61E6B05640AA51E580B9783A407B6BE3DAE5B0564079F0D468BA783A40D2A496F7DAB05640AFFB8598B5783A4086F90AA3D9B056409788379BB5783A40E461E2E0D8B05640FEFA3B07B6783A406357EF0ED8B0564032AB0B6BB8783A4051EE2D7DD7B056402B94B3E3BC783A40C693A8E6D6B05640F6C59635C5783A4005626B59D6B05640C54D5DD1D0783A400CA48F33D6B05640032793D2D9783A40CF1D6731D6B056400CC046F5E0783A405CCF042CD6B056409FE5123BE2783A40F1A3D3B9D5B056408B450739FD783A40C8D13A89D5B05640133E717E12793A4091B0A9A2D5B05640A64D96EA18793A4068243AAFD5B05640852B7CBE20793A40B5BF6BA3E7B05640F052A4B129793A407156E7A0E7B056402B074BBA2B793A4070A9D707E7B05640F2C1FC7E3B793A40094C905AE5B05640F613E8A05B793A4015F7E9CCE3B05640D8835D2D7D793A4003170EF5E2B05640187F6CB892793A40A15177B8E0B0564015ED12B8C3793A405286C0DEDEB05640DC81BEC2EC793A40A5D56392DEB0564018FA4B7DF6793A4015E14EBEDEB05640B8618678F6793A40D5BC41ECDFB0564081B5E639F7793A40DC00B00AE5B056403FD8E32D87793A40AF1EF0BA07B15640893D8EA099793A40A8D8A35909B1564066C179C1117A3A4028B6FA140AB156407C487039127A3A401E2758C90AB15640FC2164AB127A3A4069A0A6AA09B15640349498BD94793A401C6928A909B156405A786BBD92793A400655037009B15640D8A4AC2A46793A40C6E8CE5209B156409A8FDA3C39793A4090D5DC4409B1564085C4601033793A405142126809B156405C43409716793A408FF3FBD20DB1564032A748FF19793A402045CB7513B15640D9D6B32A1D793A408DD5297417B156402D700D5B1E793A40B77BD1641AB15640526164AB21793A40D7851E6D1BB1564010F3CCEC23793A40CF687AD31BB1564009CB11262B793A40887D46761AB15640BB8786935B793A40E8458BC417B15640FA930265A3793A408EBB12E615B15640AAD5FF58D0793A40533556DE15B15640F369019BD6793A4077BA061724B1564015918961DE793A406C3FD2D523B156406A081C4B227A3A40021D8A2725B1564005F4640E237A3A400600000082810B0B08B1564052AFFDED92793A4024E38E3D07B15640478D170693793A40EFE69255E5B056406132F89F80793A40D0DC5AF7E8B05640409101C82A793A40C0183BC507B1564041883C8B38793A4082810B0B08B1564052AFFDED92793A4019000000C263A0C1E2B05640D7B16A81E1783A409963D444D9B056408915A6FFDC783A4064AD1CCDD7B05640F1442D1ADD783A4004126CFFD6B05640A65D2D4BDC783A401A65B1F3D6B05640CF68EAF0D8783A407A1A43F9D6B05640C8E37971D4783A407BDF7C2AD7B05640D1A12664CE783A40769B5688D7B05640FA84B000C6783A40DB9D442AD8B056404C38F6CDBE783A4040F568E3D8B05640A9952A54BB783A4012A689EED9B0564022CFF90BB9783A40171822A5DCB05640B6F1BDCDB9783A4068814F4AE4B05640660B8E37BD783A40B426E7CCEEB05640B8DF73BEC3783A405EE93472F8B0564092500E3DC9783A4047871160FDB0564005A63D7BCC783A4080A86365FEB05640128589E4CE783A400EECD188FEB05640F563C7FCD3783A40180B648AFEB05640DE87D8F6DD783A408C733E2EFEB05640309EE0FBE4783A4051E1720AFEB05640B635346EEB783A40B3450D98FDB05640E36D0DF2ED783A40592D7880FCB056403C3E030DEF783A409C44EB15F0B056406BC8FF61E9783A40C263A0C1E2B05640D7B16A81E1783A40	2026-09-17 07:29:30.387616+00
73	11	LP-NO1N-014	No.1 Nowapara	\N	\N	0.87	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Occupied", "Used_Image": "Google Earth"}	{}	0103000020E610000001000000090000004F73620012B156408F8D2A60FB783A409954A1550AB15640E129CF59F7783A4067698F4D0AB1564088475F39FB783A40A82097480AB15640CAF6049CFD783A40F7933E220AB1564087188E0310793A40EF40F37510B156404ABF588713793A40798FED6C17B156401FC3D16517793A404C8FCC7718B1564066BD29C5FE783A404F73620012B156408F8D2A60FB783A40	2026-09-17 07:29:30.388855+00
74	11	LP-NO1N-015	No.1 Nowapara	\N	\N	0.54	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Occupied", "Used_Image": "Google Earth"}	{}	0103000020E610000001000000090000005F59B0DF21B156401BFBF00219793A40952BF6661EB15640BEAF0B3F06793A40582D20041DB1564084175B2801793A404D8FCC7718B1564061BD29C5FE783A40788FED6C17B1564015C3D16517793A401C68AA841AB15640FBA1A21D19793A40665B73681CB15640EB6968AA1E793A4016E8F2891CB1564026F0515720793A405F59B0DF21B156401BFBF00219793A40	2026-09-17 07:29:30.389629+00
75	11	LP-NO1N-016	No.1 Nowapara	\N	\N	2.22	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "No.1 Nowapara", "Plot_vacan": "Occupied", "Used_Image": "Google Earth"}	{}	0103000020E6100000010000000D0000007263DFBC22B15640C11C84AE1D793A405F59B0DF21B156401BFBF00219793A4016E8F2891CB1564026F0515720793A4070051B251DB15640D493F21928793A408D37A97D1CB156409B88CC323F793A409A67565F1CB1564090E9956143793A40D5B64AC81BB15640BEFE4D3758793A405214DB601BB15640C944059963793A406378CEEF2CB156401ACA956D6C793A401778AACE2CB156406C287D0969793A4069DD6D6C2AB156408558D30551793A4076609BFD25B15640AF681AC035793A407263DFBC22B15640C11C84AE1D793A40	2026-09-17 07:29:30.390436+00
77	13	LP-PASC-001	Paschim_Jalukbari	\N	\N	9.60	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Paschim_Jalukbari", "Plot_Vacan": "Doubtful", "Used_Image": "DLR Image"}	{}	0103000020E61000000100000036000000A808105A0AE9564030E2F185B6243A40346717DA0BE9564090C6B1E8AE243A40F48E66A60CE9564070DF73D5A8243A40CCB20E990CE956408020CB5EA4243A407C1AA9BD0CE9564030C404EA9F243A409CB56E080DE9564020BA81E394243A40C06F959C0DE95640107C56B780243A40782B680B08E95640903F419577243A40E4B7DDD106E9564060A29BC773243A404058229808E95640A01CCBF656243A405C67254709E956408048D67B4B243A40E44E601909E95640100663D745243A40B034593002E9564090E224B93B243A40D81CA090FFE85640304F36904B243A407073EB73FDE856402010323B4A243A406C31B033FDE856403033E9FF58243A4058311B4EFDE85640B094D64665243A4058936B91FDE8564000C987437F243A40FCD9963AFBE85640A0ED94787E243A409873B79AFBE8564050D3D01B6D243A40447E80CDF6E85640F01C962B69243A40D0540F74F5E85640A078D17B63243A40909B748AF5E85640C094EBBC5B243A401CA1C888F5E8564030B5198B47243A40E019EB8BF5E85640B03A2D5143243A4088BD23A2F5E85640E0A862CE3B243A40C838342CF6E85640402D6C4035243A40B098C314F7E85640C09EA75028243A4024AC3AF3EEE856403073E5E119243A4074D5DBD1ECE85640F0495A4041243A402C4F2EB1EBE85640A07AF7435F243A401C998217EBE856403003A86864243A40349AD8A1EAE8564080F0C7577C243A4050DF1BEAE9E85640507F119093243A40A8FD6484E9E85640509A3F70AC243A4008556DFEE8E85640D05C87E6C3243A4014492912E9E8564060F6A6D0C6243A40602B8A45EAE856402022C79DC6243A4090039284EBE8564090A03D82C7243A40D480F0ADEDE85640C061BDBEC6243A40289ABA44EFE85640F0ABBE0DC6243A4068C25DFAF1E85640203744BFC4243A40C4B59B1EF4E85640904991EAC1243A40C45E5EFDF4E85640A09C07E9BD243A4024A059E0F5E8564080363D31BD243A409C56A09DFBE85640E087FFC5B7243A40D80EC0F9FEE856404045CA7DB6243A40EC4EF2C201E9564070B74DC0B5243A4040A569DF03E9564010B2056CB4243A40F026CCE105E95640E0416456B2243A40ECD5422F07E956405079A8BAB1243A40908A238908E956404074FB57B2243A40E8FDD08B09E95640807C6CCAB3243A40A808105A0AE9564030E2F185B6243A40	2026-09-17 07:36:56.004338+00
78	13	LP-PASC-002	Paschim_Jalukbari	\N	\N	0.39	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Paschim_Jalukbari", "Plot_Vacan": "Doubtful", "Used_Image": "DLR Image"}	{}	0103000020E610000001000000070000006C2129F900E95640509EA4DF39243A4044FED3C2F7E85640300C9E8529243A4058AD186AF6E85640E0B4D2993B243A40787D2D79F6E8564050E669B73D243A40F02538EDFBE8564090E9B63541243A40CCC370C2FFE85640B0E06FC342243A406C2129F900E95640509EA4DF39243A40	2026-09-17 07:36:56.006131+00
79	13	LP-PASC-003	Paschim_Jalukbari	\N	\N	0.51	Occupied	General	Government Land Bank	{"Id": 0, "Plot_Name": "Paschim_Jalukbari", "Plot_Vacan": "Occupied", "Used_Image": "DLR Image"}	{}	0103000020E61000000100000009000000C88D52B3FCE85640BFE4E97B48243A40E4272D12FBE85640917E25B344243A4074F06BA6F6E8564020792F1044243A40E8980091F6E8564060BD54F160243A40E0830134F7E856403068C1A965243A40988FF4E2F8E8564051CC464F68243A4058D5B111FCE85640D028B8D669243A40ECD241AFFCE85640C0BFC8FC48243A40C88D52B3FCE85640BFE4E97B48243A40	2026-09-17 07:36:56.007588+00
80	13	LP-PASC-004	Paschim_Jalukbari	\N	\N	0.56	Inner Road	General	Government Land Bank	{"Id": 0, "Plot_Name": "Paschim_Jalukbari", "Plot_Vacan": "Inner Road", "Used_Image": "DLR Image"}	{}	0103000020E6100000020000001900000058936B91FDE8564001C987437F243A405A311B4EFDE85640B694D64665243A406C31B033FDE856403033E9FF58243A407073EB73FDE856401E10323B4A243A40D81CA090FFE85640304F36904B243A40B034593002E9564095E224B93B243A40429C9A3201E95640FFC09A453A243A406D2129F900E95640499EA4DF39243A40CCC370C2FFE85640ADE06FC342243A40111CD3EAFCE85640A87D829C41243A40F02538EDFBE8564090E9B63541243A40797D2D79F6E8564052E669B73D243A4059AD186AF6E85640EAB4D2993B243A4043FED3C2F7E85640360C9E8529243A40AF98C314F7E85640BF9EA75028243A40C838342CF6E85640402D6C4035243A4088BD23A2F5E85640E6A862CE3B243A40E119EB8BF5E85640AE3A2D5143243A401CA1C888F5E8564030B5198B47243A40909B748AF5E85640BE94EBBC5B243A40D0540F74F5E85640A278D17B63243A40447E80CDF6E85640F61C962B69243A409973B79AFBE8564055D3D01B6D243A40FDD9963AFBE856409BED94787E243A4058936B91FDE8564001C987437F243A4009000000E8980091F6E856405DBD54F160243A4075F06BA6F6E8564028792F1044243A40E4272D12FBE85640987E25B344243A40C98D52B3FCE85640C1E4E97B48243A40ECD241AFFCE85640C1BFC8FC48243A4058D5B111FCE85640D428B8D669243A40988FF4E2F8E8564051CC464F68243A40E1830134F7E856403468C1A965243A40E8980091F6E856405DBD54F160243A40	2026-09-17 07:36:56.009205+00
81	13	LP-PASC-005	Paschim_Jalukbari	\N	\N	2.58	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Paschim_Jalukbari", "Plot_Vacan": "Doubtful", "Used_Image": "DLR Image"}	{}	0103000020E61000000100000021000000A808105A0AE9564030E2F185B6243A40E8FDD08B09E95640807C6CCAB3243A40908A238908E956404074FB57B2243A40ECD5422F07E956405079A8BAB1243A40F026CCE105E95640E0416456B2243A4040A569DF03E9564010B2056CB4243A40EC4EF2C201E9564070B74DC0B5243A40D80EC0F9FEE856404045CA7DB6243A409C56A09DFBE85640E087FFC5B7243A4024A059E0F5E8564080363D31BD243A40C45E5EFDF4E85640A09C07E9BD243A40C4B59B1EF4E85640904991EAC1243A4068C25DFAF1E85640203744BFC4243A40289ABA44EFE85640F0ABBE0DC6243A40D480F0ADEDE85640C061BDBEC6243A4090039284EBE8564090A03D82C7243A40602B8A45EAE856402022C79DC6243A4014492912E9E8564060F6A6D0C6243A4010CC7767E9E8564050E6FB69D3243A40D0EAE190EAE85640E05FB282D6243A4060201C0FECE85640A0BB9781D7243A40185947E1EDE85640A08F3493D7243A4068D490F6EFE8564060FF02F3D6243A408066AEFAF1E8564020048206D7243A40F4CAE00DF4E85640B0C09737D9243A40C0AE02ACF5E85640C0549818DC243A40588DDAF5F6E8564020FA175FE0243A40CCDD4D3EF8E85640304C7286E6243A404425A32102E95640E0BF8FF5E5243A40F8DC1B2E03E95640A06A552EE3243A402C8EB09F06E95640F01B48F1CD243A400C4953BD09E95640D09782A1B9243A40A808105A0AE9564030E2F185B6243A40	2026-09-17 07:36:56.010837+00
82	14	LP-SARU-001	Sarusajai	\N	\N	21.31	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Sarusajai", "Plot_Vacan": "Doubtful", "Used_Image": "DLR Image"}	{}	0103000020E6100000010000001C00000061D2AE4F54F05640D17A74E2291D3A400FBF07E954F05640B404CD50261D3A408E52D6275BF056407C006647251D3A40212F2A0C65F05640FE0C3355221D3A40C46C9C6367F056400F78BB19221D3A40EFAAF0B96BF056408AE5944F211D3A40215560B671F05640B399ACF31F1D3A40BB7A380572F05640B71F8C3D1E1D3A406A87F2BC71F05640EEA0213F161D3A402CF7CA2F71F05640D858F43F011D3A40C8A4F2F770F05640EA412EFEE01C3A40740C051271F056409B83277CBA1C3A406253DB1A71F05640233E3BC29E1C3A40214488E344F056400B5F0C08A31C3A409680B01F30F05640613331F0A21C3A40B64127A032F0564064BDDEA5C11C3A403C5EBFDE32F05640AF53EB86C71C3A409EA1E8D832F056408A1DFBA2E81C3A40A008112F33F05640A68BE1D7FC1C3A400799A3B733F056402AD52D5A101D3A40BB0F8FE233F05640EC1DBDB01A1D3A4058F31D4B34F05640AF9401512C1D3A40FA55146134F056408CD16D3F2F1D3A406F9645D334F056402907C1BE2E1D3A40A26D5AEC3DF0564053E63AF0301D3A400AB9AC5944F05640DACDF5C62C1D3A40C49FD72A48F05640360A46F82B1D3A4061D2AE4F54F05640D17A74E2291D3A40	2026-09-17 07:38:11.243913+00
83	14	LP-SARU-002	Sarusajai	\N	\N	9.87	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "Sarusajai", "Plot_Vacan": "Doubtful", "Used_Image": "DLR Image"}	{}	0103000020E6100000010000002D000000136B332516F05640832E01ED291D3A4027A775101DF05640672150792D1D3A4039A1B75023F05640B815691A311D3A40D7FB1BF527F05640C89EF460321D3A40AF044C7D2BF05640D2CB67D0321D3A40B8F7F5532FF056402C24FD15321D3A4053B5222132F05640627B6AC8311D3A4039ED1A4933F05640102CE97A301D3A40FE51B2B832F05640364C2A11181D3A407E749AF331F056404DEE63A0FB1C3A400BAFC7BD31F0564094074DD5E81C3A40EF7A1ED031F056401ABCABD4CD1C3A404E0051A631F056402C8857D9C11C3A40F1F0416430F05640AE085BD6B11C3A40DC72C9102FF0564019804A04A31C3A40432B46A627F056406EE07697A31C3A40CFBF4F5628F0564007B82E2EAD1C3A402ABE02A128F056403CCBEB92B11C3A4036099FBD28F05640EA6F4B77B81C3A407D92418E28F056403FEACED7BC1C3A4064E02E1A28F0564087407B57C41C3A40A74A74D327F0564080330870CA1C3A40D4F12D6C27F0564079F1EA6ECF1C3A40C92AE94727F05640D8B3D0CFD31C3A404E6D745027F056404FD4F491D71C3A400922A79127F056401478369DD91C3A40396F36B128F0564060BCDB0FDB1C3A40983E2A0928F0564058EA3163DD1C3A40340A433527F0564064FFA0ECDE1C3A40DC6CB86026F0564022728066E11C3A406937028B25F0564046F52D99E51C3A4063D8C08B25F0564017C6AA80E41C3A405D1775A525F0564075040557DF1C3A4055EDAD9F25F056400DA2F982D71C3A4080391D9A25F056403DC2C85ECF1C3A40FD5019E025F05640B616BF5ECA1C3A40A3A3005326F05640050DE197C41C3A405B5FEABA26F05640DAE68DA8BE1C3A4036C0252327F05640927F0241B81C3A405EA3BE3C27F056407C6B6F3FB31C3A40C7BB6C4127F05640ADC3365CAC1C3A403F726F7E26F056408C4E65AEA31C3A4005CD402814F0564018B42D1AA51C3A405F252F0B15F0564034AA7C0EDF1C3A40136B332516F05640832E01ED291D3A40	2026-09-17 07:38:11.245202+00
84	14	LP-SARU-003	Sarusajai	\N	\N	0.26	Inner Road	General	Government Land Bank	{"Id": 0, "Plot_Name": "Sarusajai", "Plot_Vacan": "Inner Road", "Used_Image": "DLR Image"}	{}	0103000020E6100000010000001C000000442B46A627F056406AE07697A31C3A403F726F7E26F056408C4E65AEA31C3A40C6BB6C4127F05640A8C3365CAC1C3A405DA3BE3C27F05640736B6F3FB31C3A4035C0252327F056408C7F0241B81C3A405A5FEABA26F05640E0E68DA8BE1C3A40A2A3005326F05640000DE197C41C3A40FD5019E025F05640B616BF5ECA1C3A4080391D9A25F0564039C2C85ECF1C3A4055EDAD9F25F056400DA2F982D71C3A405D1775A525F0564070040557DF1C3A4062D8C08B25F0564013C6AA80E41C3A406937028B25F056403CF52D99E51C3A40DC6CB86026F0564018728066E11C3A40340A433527F0564064FFA0ECDE1C3A40953E2A0928F0564052EA3163DD1C3A40396F36B128F056405BBCDB0FDB1C3A400622A79127F056401478369DD91C3A404E6D745027F056404FD4F491D71C3A40C82AE94727F05640D4B3D0CFD31C3A40D4F12D6C27F0564074F1EA6ECF1C3A40A74A74D327F0564080330870CA1C3A4062E02E1A28F0564087407B57C41C3A407C92418E28F056403BEACED7BC1C3A4036099FBD28F05640E16F4B77B81C3A402BBE02A128F056403CCBEB92B11C3A40CFBF4F5628F0564007B82E2EAD1C3A40442B46A627F056406AE07697A31C3A40	2026-09-17 07:38:11.246068+00
85	14	LP-SARU-004	Sarusajai	\N	\N	0.39	Inner Road	General	Government Land Bank	{"Id": 0, "Plot_Name": "Sarusajai", "Plot_Vacan": "Inner Road", "Used_Image": "DLR Image"}	{}	0103000020E61000000100000013000000FA55146134F056408CD16D3F2F1D3A4058F31D4B34F05640AF9401512C1D3A40BB0F8FE233F05640EC1DBDB01A1D3A400799A3B733F056402AD52D5A101D3A40A008112F33F05640A68BE1D7FC1C3A409DA1E8D832F056408A1DFBA2E81C3A403C5EBFDE32F05640AF53EB86C71C3A40B64127A032F0564064BDDEA5C11C3A409480B01F30F05640613331F0A21C3A40D7BCAC1430F05640227F24F0A21C3A40DB72C9102FF0564015804A04A31C3A40F1F0416430F05640AE085BD6B11C3A404E0051A631F056402C8857D9C11C3A40EE7A1ED031F0564015BCABD4CD1C3A400AAFC7BD31F0564094074DD5E81C3A407D749AF331F056404DEE63A0FB1C3A40FE51B2B832F05640364C2A11181D3A4038ED1A4933F056400B2CE97A301D3A40FA55146134F056408CD16D3F2F1D3A40	2026-09-17 07:38:11.246909+00
86	14	LP-SARU-005	Sarusajai	\N	\N	0.77	Inner Road	General	Government Land Bank	{"Id": 0, "Plot_Name": "Sarusajai", "Plot_Vacan": "Outer Road", "Used_Image": "DLR Image"}	{}	0103000020E610000001000000110000006253DB1A71F05640233E3BC29E1C3A40740C051271F056409B83277CBA1C3A40C8A4F2F770F05640EA412EFEE01C3A402CF7CA2F71F05640D858F43F011D3A406A87F2BC71F05640EEA0213F161D3A40BB7A380572F05640B71F8C3D1E1D3A40215560B671F05640B399ACF31F1D3A40EFAAF0B96BF056408AE5944F211D3A40C46C9C6367F056400F78BB19221D3A40212F2A0C65F05640FE0C3355221D3A408E52D6275BF056407C006647251D3A400FBF07E954F05640B404CD50261D3A4061D2AE4F54F05640D17A74E2291D3A40B16804FA71F05640C58DA6F5241D3A4055F431DC72F05640DCC95FBA1E1D3A40ACEAC03E72F05640E26D03A69E1C3A406253DB1A71F05640233E3BC29E1C3A40	2026-09-17 07:38:11.247737+00
87	15	LP-NO2J-001	No_2_Japorigog	\N	\N	1.61	Vacan	General	Government Land Bank	{"Id": 0, "Plot_Name": "No_2_Japorigog", "Plot_Vacan": "Wrong Co ordinate", "Used_Image": "DLR Image"}	{}	0103000020E61000000100000005000000010F941B85F15640EB5AEE69C0283A4042F1426494F15640FB268DB7C1283A403817CFA994F1564074F97A3198283A40659B256185F156402266DDE396283A40010F941B85F15640EB5AEE69C0283A40	2026-09-19 09:55:27.717107+00
88	15	LP-NO2J-002	No_2_Japorigog	\N	\N	0.38	Inner Road	General	Government Land Bank	{"Id": 0, "Plot_Name": "No_2_Japorigog", "Plot_Vacan": "Inner Rpad", "Used_Image": ""}	{}	0103000020E610000001000000240000008979E9EBB1F156409168A19AD1283A40053614B0B0F15640A16E851FCA283A40A8D4BB85AEF156401F7C0AB2CE283A407CDFEF2BADF1564080BBDECDCD283A404B39AA1EABF1564054516E5EC2283A4024DDC526AAF156406E19107FC4283A4088105C41ABF1564099067C43CA283A40E9539475ABF1564033420BDECB283A4024BD7A6EABF15640481A2086CC283A40E7BA7037A7F15640746E5256D6283A40ED2370ABA6F15640F92AA781D6283A4078C89B62A6F156404C74DAD6D5283A40031DCF89A4F1564018EBCAA1CB283A404F08B23AA4F1564028978066CA283A40CFBE34BCA2F15640C7479193CE283A406C86C545A5F156405CBCE668DD283A40F7EF11D0ABF15640A05C2603D0283A40CDB74D41ACF1564090EEFF06D0283A4069BB33C5ACF156409BDC7304D2283A40FAFDEB79ADF15640C273F3B9D0283A40B9F0D0F1ADF15640FFE806BED0283A400B9D4882AEF15640ADCE75DCD3283A401D5A7042B0F1564059A74F1AD1283A40600CA883B0F15640F6F6FA2DD1283A406C9183BFB3F15640751C1362E4283A4054F44A67B3F15640317F46D0E6283A401F890D69B2F15640C1E07678E8283A4091C95203AEF15640CED9215FF2283A40FF517A93AEF156407C0DC9F5F5283A402EA2394DB0F156405AF73BD3F2283A40DD86315FB2F156405A367B42ED283A4019B83686B3F15640652D1463EA283A40DCFC7842B4F15640168D2FC8E7283A40B774CFB4B4F15640C3E5C18AE4283A401A1142DCB4F15640F090986CE3283A408979E9EBB1F156409168A19AD1283A40	2026-09-19 09:55:27.813084+00
89	15	LP-NO2J-003	No_2_Japorigog	\N	\N	6.25	Doubtful	General	Government Land Bank	{"Id": 0, "Plot_Name": "No_2_Japorigog", "Plot_Vacan": "Doubtful", "Used_Image": ""}	{}	0103000020E6100000010000002F0000001A1142DCB4F15640F090986CE3283A40DCFC7842B4F15640168D2FC8E7283A4019B83686B3F15640652D1463EA283A40DD86315FB2F156405A367B42ED283A402EA2394DB0F156405AF73BD3F2283A40FF517A93AEF156407C0DC9F5F5283A4091C95203AEF15640CED9215FF2283A401F890D69B2F15640C1E07678E8283A4054F44A67B3F15640317F46D0E6283A40699183BFB3F15640751C1362E4283A40600CA883B0F15640F6F6FA2DD1283A401D5A7042B0F1564059A74F1AD1283A400B9D4882AEF15640ADCE75DCD3283A40B9F0D0F1ADF15640FFE806BED0283A40FAFDEB79ADF15640C273F3B9D0283A4069BB33C5ACF156409BDC7304D2283A40CDB74D41ACF1564090EEFF06D0283A40F7EF11D0ABF15640A05C2603D0283A406C86C545A5F156405CBCE668DD283A40CFBE34BCA2F15640C7479193CE283A404F08B23AA4F1564028978066CA283A40031DCF89A4F1564018EBCAA1CB283A4078C89B62A6F156404C74DAD6D5283A40ED2370ABA6F15640F92AA781D6283A40E7BA7037A7F15640746E5256D6283A4024BD7A6EABF15640481A2086CC283A40E9539475ABF1564033420BDECB283A4088105C41ABF1564099067C43CA283A4024DDC526AAF156406E19107FC4283A404B39AA1EABF1564054516E5EC2283A407CDFEF2BADF1564080BBDECDCD283A40A8D4BB85AEF156401F7C0AB2CE283A40053614B0B0F15640A16E851FCA283A4099868EFFA7F15640CF8B9E6E95283A409EB672EB9FF156401D76EBFAB2283A40A7505C9297F15640743C920AD4283A408B93784FA5F156402AD99B2F26293A405C0E6006A9F156409F96C52A21293A40475A29F5AAF156408A93366A1E293A40712E4179AFF15640F676C0EE18293A4079588A96B1F156407345DC5F16293A40F44C9535B3F156401C1D725413293A40DAA9CF82B5F156409F3036CE0E293A402276A737B7F15640738F320A09293A40F50665B6B8F15640B375F17C04293A40634154ADB9F15640806F75A100293A401A1142DCB4F15640F090986CE3283A40	2026-09-19 09:55:27.849624+00
\.


--
-- Data for Name: layer_categories; Type: TABLE DATA; Schema: public; Owner: gis_admin
--

COPY public.layer_categories (id, name, display_order) FROM stdin;
1	Administrative Boundaries	1
2	Industrial Assets	2
3	Infrastructure & Utilities	3
\.


--
-- Data for Name: layer_metadata; Type: TABLE DATA; Schema: public; Owner: gis_admin
--

COPY public.layer_metadata (id, layer_id, description, source_department, data_owner, coordinate_reference_system, scale, version, license, keywords, last_updated) FROM stdin;
2	3	Uploaded Dataset: Amerigog_inner_boundary	GIS Administration	Admin User	EPSG:4326	1:1000	1.0	Open Government Data License	{}	2026-09-17 06:23:47.455385+00
3	4	Uploaded Dataset: Bonda_inner_boundary	GIS Administration	Admin User	EPSG:4326	1:1000	1.0	Open Government Data License	{}	2026-09-17 06:45:21.395535+00
5	6	Uploaded Dataset: Chouhdhuripara_inner_boundary	GIS Administration	Admin User	EPSG:4326	1:1000	1.0	Open Government Data License	{}	2026-09-17 07:19:19.594479+00
6	7	Uploaded Dataset: Dhing_Gaon_inner_Boundary	GIS Administration	Admin User	EPSG:4326	1:1000	1.0	Open Government Data License	{}	2026-09-17 07:20:17.857415+00
7	8	Uploaded Dataset: Dolai_gaon_part_3_inner_boundary	GIS Administration	Admin User	EPSG:4326	1:1000	1.0	Open Government Data License	{}	2026-09-17 07:21:04.872801+00
8	9	Uploaded Dataset: Nakhola_Grant_inner_boundary	GIS Administration	Admin User	EPSG:4326	1:1000	1.0	Open Government Data License	{}	2026-09-17 07:22:26.350645+00
9	10	Uploaded Dataset: Naltali_inner_boundary	GIS Administration	Admin User	EPSG:4326	1:1000	1.0	Open Government Data License	{}	2026-09-17 07:23:21.199515+00
17	18	Uploaded Dataset: Namali_Jalah_inner_boundary	GIS Administration	Admin User	EPSG:4326	1:1000	1.0	Open Government Data License	{}	2026-09-17 07:26:51.364322+00
18	18	Uploaded Dataset: Namali_Jalah_inner_boundary	GIS Administration	Admin User	EPSG:4326	1:1000	1.0	Open Government Data License	{}	2026-09-17 07:27:11.940617+00
19	20	Uploaded Dataset: No_1_Nowpara_inner_boundary	GIS Administration	Admin User	EPSG:4326	1:1000	1.0	Open Government Data License	{}	2026-09-17 07:29:30.357713+00
21	22	Uploaded Dataset: Paschim_Jalukbari_inner_boundary	GIS Administration	Admin User	EPSG:4326	1:1000	1.0	Open Government Data License	{}	2026-09-17 07:36:55.992456+00
22	23	Uploaded Dataset: Sarusajai_inner_boundary	GIS Administration	Admin User	EPSG:4326	1:1000	1.0	Open Government Data License	{}	2026-09-17 07:38:11.233454+00
23	24	Uploaded Dataset: No_2_Japorigog_inner_boundary	GIS Administration	Admin User	EPSG:4326	1:1000	1.0	Open Government Data License	{}	2026-09-19 09:55:27.480875+00
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: gis_admin
--

COPY public.roles (id, name, description) FROM stdin;
1	Super Administrator	Full system control, settings, user configuration
2	Department Administrator	Manages estates, land inventories, settings
3	GIS Administrator	Controls layers, parses shapefiles, edits spatial records
4	Data Entry Operator	CRUD operations on land registers and parcels
5	General Government User	Read-only access to GIS viewer, maps, dashboard stats
\.


--
-- Data for Name: spatial_ref_sys; Type: TABLE DATA; Schema: public; Owner: gis_admin
--

COPY public.spatial_ref_sys (srid, auth_name, auth_srid, srtext, proj4text) FROM stdin;
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: gis_admin
--

COPY public.system_settings (id, setting_key, setting_value, description) FROM stdin;
1	DEFAULT_CRS	EPSG:4326	Default Coordinate Reference System for spatial queries
2	MAP_CENTER_LAT	26.18	Map Center Latitude Coordinate
3	MAP_CENTER_LNG	91.76	Map Center Longitude Coordinate
4	MAP_DEFAULT_ZOOM	12	Default Zoom level of interactive map
5	MAX_UPLOAD_SIZE_MB	50	Maximum size of shapefile/geopackage zip files upload
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: gis_admin
--

COPY public.users (id, username, password_hash, full_name, email, role_id, is_active, created_at) FROM stdin;
2	dataentry	pbkdf2_sha256$600000$mockedhashvalue$dataentrypasswordhash	Data Entry Officer	data.entry@gov.in	4	t	2026-07-31 10:17:11.753166+00
1	gisadmin	pbkdf2_sha256$600000$M2Qow761gMrOTroXpy8JWm$+CLrWr43X/Mni5wQEZSXSu/YER9UjE33DXct/EPfquQ=	State GIS Administrator	gis.admin@gov.in	1	t	2026-07-31 10:17:11.753166+00
3	operator	pbkdf2_sha256$600000$lRWWNeMYeRMDrRSMFjjf2w$N+4cYTBFpqd6Iif29FQDaYGS/VLLXbZmqauKLWfHgvs=	\N	\N	1	t	2026-09-17 06:17:15.840911+00
\.


--
-- Data for Name: villages; Type: TABLE DATA; Schema: public; Owner: gis_admin
--

COPY public.villages (id, circle_id, name, code, geom, created_at) FROM stdin;
\.


--
-- Data for Name: geocode_settings; Type: TABLE DATA; Schema: tiger; Owner: gis_admin
--

COPY tiger.geocode_settings (name, setting, unit, category, short_desc) FROM stdin;
\.


--
-- Data for Name: pagc_gaz; Type: TABLE DATA; Schema: tiger; Owner: gis_admin
--

COPY tiger.pagc_gaz (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- Data for Name: pagc_lex; Type: TABLE DATA; Schema: tiger; Owner: gis_admin
--

COPY tiger.pagc_lex (id, seq, word, stdword, token, is_custom) FROM stdin;
\.


--
-- Data for Name: pagc_rules; Type: TABLE DATA; Schema: tiger; Owner: gis_admin
--

COPY tiger.pagc_rules (id, rule, is_custom) FROM stdin;
\.


--
-- Data for Name: topology; Type: TABLE DATA; Schema: topology; Owner: gis_admin
--

COPY topology.topology (id, name, srid, "precision", hasz) FROM stdin;
\.


--
-- Data for Name: layer; Type: TABLE DATA; Schema: topology; Owner: gis_admin
--

COPY topology.layer (topology_id, layer_id, schema_name, table_name, feature_column, feature_type, level, child_id) FROM stdin;
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gis_admin
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 31, true);


--
-- Name: circles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gis_admin
--

SELECT pg_catalog.setval('public.circles_id_seq', 4, true);


--
-- Name: districts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gis_admin
--

SELECT pg_catalog.setval('public.districts_id_seq', 4, true);


--
-- Name: gis_layers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gis_admin
--

SELECT pg_catalog.setval('public.gis_layers_id_seq', 24, true);


--
-- Name: industrial_estates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gis_admin
--

SELECT pg_catalog.setval('public.industrial_estates_id_seq', 15, true);


--
-- Name: infrastructure_layers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gis_admin
--

SELECT pg_catalog.setval('public.infrastructure_layers_id_seq', 2, true);


--
-- Name: integration_adapters_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gis_admin
--

SELECT pg_catalog.setval('public.integration_adapters_id_seq', 2, true);


--
-- Name: land_parcels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gis_admin
--

SELECT pg_catalog.setval('public.land_parcels_id_seq', 89, true);


--
-- Name: layer_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gis_admin
--

SELECT pg_catalog.setval('public.layer_categories_id_seq', 3, true);


--
-- Name: layer_metadata_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gis_admin
--

SELECT pg_catalog.setval('public.layer_metadata_id_seq', 23, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gis_admin
--

SELECT pg_catalog.setval('public.roles_id_seq', 5, true);


--
-- Name: system_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gis_admin
--

SELECT pg_catalog.setval('public.system_settings_id_seq', 5, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gis_admin
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: villages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: gis_admin
--

SELECT pg_catalog.setval('public.villages_id_seq', 4, true);


--
-- Name: topology_id_seq; Type: SEQUENCE SET; Schema: topology; Owner: gis_admin
--

SELECT pg_catalog.setval('topology.topology_id_seq', 1, false);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: circles circles_district_id_name_key; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.circles
    ADD CONSTRAINT circles_district_id_name_key UNIQUE (district_id, name);


--
-- Name: circles circles_pkey; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.circles
    ADD CONSTRAINT circles_pkey PRIMARY KEY (id);


--
-- Name: districts districts_code_key; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.districts
    ADD CONSTRAINT districts_code_key UNIQUE (code);


--
-- Name: districts districts_name_key; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.districts
    ADD CONSTRAINT districts_name_key UNIQUE (name);


--
-- Name: districts districts_pkey; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.districts
    ADD CONSTRAINT districts_pkey PRIMARY KEY (id);


--
-- Name: gis_layers gis_layers_name_key; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.gis_layers
    ADD CONSTRAINT gis_layers_name_key UNIQUE (name);


--
-- Name: gis_layers gis_layers_pkey; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.gis_layers
    ADD CONSTRAINT gis_layers_pkey PRIMARY KEY (id);


--
-- Name: industrial_estates industrial_estates_name_key; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.industrial_estates
    ADD CONSTRAINT industrial_estates_name_key UNIQUE (name);


--
-- Name: industrial_estates industrial_estates_pkey; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.industrial_estates
    ADD CONSTRAINT industrial_estates_pkey PRIMARY KEY (id);


--
-- Name: infrastructure_layers infrastructure_layers_pkey; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.infrastructure_layers
    ADD CONSTRAINT infrastructure_layers_pkey PRIMARY KEY (id);


--
-- Name: integration_adapters integration_adapters_pkey; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.integration_adapters
    ADD CONSTRAINT integration_adapters_pkey PRIMARY KEY (id);


--
-- Name: integration_adapters integration_adapters_system_name_key; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.integration_adapters
    ADD CONSTRAINT integration_adapters_system_name_key UNIQUE (system_name);


--
-- Name: land_parcels land_parcels_parcel_id_key; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.land_parcels
    ADD CONSTRAINT land_parcels_parcel_id_key UNIQUE (parcel_id);


--
-- Name: land_parcels land_parcels_pkey; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.land_parcels
    ADD CONSTRAINT land_parcels_pkey PRIMARY KEY (id);


--
-- Name: layer_categories layer_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.layer_categories
    ADD CONSTRAINT layer_categories_name_key UNIQUE (name);


--
-- Name: layer_categories layer_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.layer_categories
    ADD CONSTRAINT layer_categories_pkey PRIMARY KEY (id);


--
-- Name: layer_metadata layer_metadata_pkey; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.layer_metadata
    ADD CONSTRAINT layer_metadata_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: villages villages_circle_id_name_key; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.villages
    ADD CONSTRAINT villages_circle_id_name_key UNIQUE (circle_id, name);


--
-- Name: villages villages_pkey; Type: CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.villages
    ADD CONSTRAINT villages_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_logs_action; Type: INDEX; Schema: public; Owner: gis_admin
--

CREATE INDEX idx_audit_logs_action ON public.audit_logs USING btree (action_type);


--
-- Name: idx_audit_logs_time; Type: INDEX; Schema: public; Owner: gis_admin
--

CREATE INDEX idx_audit_logs_time ON public.audit_logs USING btree (created_at);


--
-- Name: idx_circles_geom; Type: INDEX; Schema: public; Owner: gis_admin
--

CREATE INDEX idx_circles_geom ON public.circles USING gist (geom);


--
-- Name: idx_districts_geom; Type: INDEX; Schema: public; Owner: gis_admin
--

CREATE INDEX idx_districts_geom ON public.districts USING gist (geom);


--
-- Name: idx_estates_geom; Type: INDEX; Schema: public; Owner: gis_admin
--

CREATE INDEX idx_estates_geom ON public.industrial_estates USING gist (geom);


--
-- Name: idx_infra_geom; Type: INDEX; Schema: public; Owner: gis_admin
--

CREATE INDEX idx_infra_geom ON public.infrastructure_layers USING gist (geom);


--
-- Name: idx_parcels_geom; Type: INDEX; Schema: public; Owner: gis_admin
--

CREATE INDEX idx_parcels_geom ON public.land_parcels USING gist (geom);


--
-- Name: idx_parcels_status; Type: INDEX; Schema: public; Owner: gis_admin
--

CREATE INDEX idx_parcels_status ON public.land_parcels USING btree (availability_status);


--
-- Name: idx_villages_geom; Type: INDEX; Schema: public; Owner: gis_admin
--

CREATE INDEX idx_villages_geom ON public.villages USING gist (geom);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: circles circles_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.circles
    ADD CONSTRAINT circles_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.districts(id) ON DELETE CASCADE;


--
-- Name: gis_layers gis_layers_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.gis_layers
    ADD CONSTRAINT gis_layers_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.layer_categories(id) ON DELETE CASCADE;


--
-- Name: industrial_estates industrial_estates_district_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.industrial_estates
    ADD CONSTRAINT industrial_estates_district_id_fkey FOREIGN KEY (district_id) REFERENCES public.districts(id) ON DELETE SET NULL;


--
-- Name: land_parcels land_parcels_estate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.land_parcels
    ADD CONSTRAINT land_parcels_estate_id_fkey FOREIGN KEY (estate_id) REFERENCES public.industrial_estates(id) ON DELETE CASCADE;


--
-- Name: land_parcels land_parcels_village_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.land_parcels
    ADD CONSTRAINT land_parcels_village_id_fkey FOREIGN KEY (village_id) REFERENCES public.villages(id) ON DELETE SET NULL;


--
-- Name: layer_metadata layer_metadata_layer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.layer_metadata
    ADD CONSTRAINT layer_metadata_layer_id_fkey FOREIGN KEY (layer_id) REFERENCES public.gis_layers(id) ON DELETE CASCADE;


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: villages villages_circle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: gis_admin
--

ALTER TABLE ONLY public.villages
    ADD CONSTRAINT villages_circle_id_fkey FOREIGN KEY (circle_id) REFERENCES public.circles(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

