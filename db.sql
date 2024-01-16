--
-- PostgreSQL database dump
--

-- Dumped from database version 16.1
-- Dumped by pg_dump version 16.1

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
-- Name: citext; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS citext WITH SCHEMA public;


--
-- Name: EXTENSION citext; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION citext IS 'data type for case-insensitive character strings';


--
-- Name: share_level; Type: TYPE; Schema: public; Owner: liamr
--

CREATE TYPE public.share_level AS ENUM (
    'none',
    'view',
    'edit'
);


ALTER TYPE public.share_level OWNER TO liamr;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: characters; Type: TABLE; Schema: public; Owner: liamr
--

CREATE TABLE public.characters (
    character_id uuid NOT NULL,
    owner uuid NOT NULL,
    title character varying(80) NOT NULL,
    link_sharing public.share_level DEFAULT 'none'::public.share_level NOT NULL,
    content jsonb NOT NULL
);


ALTER TABLE public.characters OWNER TO liamr;

--
-- Name: session; Type: TABLE; Schema: public; Owner: liamr
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


ALTER TABLE public.session OWNER TO liamr;

--
-- Name: sharing; Type: TABLE; Schema: public; Owner: liamr
--

CREATE TABLE public.sharing (
    "character" uuid NOT NULL,
    "user" uuid NOT NULL,
    share_type public.share_level NOT NULL
);


ALTER TABLE public.sharing OWNER TO liamr;

--
-- Name: users; Type: TABLE; Schema: public; Owner: liamr
--

CREATE TABLE public.users (
    user_id uuid NOT NULL,
    username character varying(50) NOT NULL,
    email public.citext NOT NULL,
    display_name character varying(80) NOT NULL,
    password bytea NOT NULL,
    salt bytea NOT NULL,
    created timestamp without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO liamr;

--
-- Name: sharing character_user_unique; Type: CONSTRAINT; Schema: public; Owner: liamr
--

ALTER TABLE ONLY public.sharing
    ADD CONSTRAINT character_user_unique UNIQUE ("character", "user");


--
-- Name: characters characters_pkey; Type: CONSTRAINT; Schema: public; Owner: liamr
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_pkey PRIMARY KEY (character_id);


--
-- Name: characters owner_title_unique; Type: CONSTRAINT; Schema: public; Owner: liamr
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT owner_title_unique UNIQUE (owner, title);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: liamr
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: liamr
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: liamr
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: liamr
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: liamr
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- PostgreSQL database dump complete
--

