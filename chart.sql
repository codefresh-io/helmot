-- Table: public.chart

-- DROP TABLE public.chart;

CREATE TABLE public.chart
(
    id character(64) COLLATE pg_catalog."default" NOT NULL,
    name character varying COLLATE pg_catalog."default" NOT NULL,
    version character varying(40) COLLATE pg_catalog."default" NOT NULL,
    description character varying COLLATE pg_catalog."default",
    "raw" text COLLATE pg_catalog."default",
    CONSTRAINT chart_pkey PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.chart
    OWNER to postgres;

-- Index: chart_id

-- DROP INDEX public.chart_id;

CREATE UNIQUE INDEX chart_id
    ON public.chart USING btree
    (id COLLATE pg_catalog."default")
    TABLESPACE pg_default;

-- Index: chart_name

-- DROP INDEX public.chart_name;

CREATE INDEX chart_name
    ON public.chart USING btree
    (name COLLATE pg_catalog."default")
    TABLESPACE pg_default;

-- Table: public.chart

-- DROP TABLE public.chart;

CREATE TABLE public.chart
(
    id character(64) COLLATE pg_catalog."default" NOT NULL,
    name character varying COLLATE pg_catalog."default" NOT NULL,
    version character varying(40) COLLATE pg_catalog."default" NOT NULL,
    description character varying COLLATE pg_catalog."default",
    "raw" text COLLATE pg_catalog."default",
    CONSTRAINT chart_pkey PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.chart
    OWNER to postgres;

-- Index: chart_id

-- DROP INDEX public.chart_id;

CREATE UNIQUE INDEX chart_id
    ON public.chart USING btree
    (id COLLATE pg_catalog."default")
    TABLESPACE pg_default;

-- Index: chart_name

-- DROP INDEX public.chart_name;

CREATE INDEX chart_name
    ON public.chart USING btree
    (name COLLATE pg_catalog."default")
    TABLESPACE pg_default;

-- Table: public.repo

-- DROP TABLE public.repo;

CREATE TABLE public.repo
(
    id character(36) COLLATE pg_catalog."default" NOT NULL,
    name character varying COLLATE pg_catalog."default",
    url_template character varying(50) COLLATE pg_catalog."default",
    CONSTRAINT repo_pkey PRIMARY KEY (id)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

ALTER TABLE public.repo
    OWNER to postgres;

-- Index: repo_id

-- DROP INDEX public.repo_id;

CREATE UNIQUE INDEX repo_id
    ON public.repo USING btree
    (id COLLATE pg_catalog."default")
    TABLESPACE pg_default;

-- Index: repo_name

-- DROP INDEX public.repo_name;

CREATE INDEX repo_name
    ON public.repo USING btree
    (name COLLATE pg_catalog."default")
    TABLESPACE pg_default;
