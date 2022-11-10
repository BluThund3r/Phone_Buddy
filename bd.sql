--
-- PostgreSQL database dump
--

-- Dumped from database version 14.2
-- Dumped by pg_dump version 14.2

-- Started on 2022-04-13 11:39:32

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
-- TOC entry 832 (class 1247 OID 24701)
-- Name: categ_accesorii; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.categ_accesorii AS ENUM (
    'phone_cases_and_screen_protectors',
    'tech_accessories',
    'phone_holders_and_waterproof_bags'
);


ALTER TYPE public.categ_accesorii OWNER TO postgres;

--
-- TOC entry 841 (class 1247 OID 24758)
-- Name: roluri; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.roluri AS ENUM (
    'admin',
    'moderator',
    'comun'
);


ALTER TYPE public.roluri OWNER TO postgres;

--
-- TOC entry 835 (class 1247 OID 24708)
-- Name: tipuri_produse; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tipuri_produse AS ENUM (
    'phone_cases',
    'pop-sockets',
    'chargers',
    'phone holders',
    'earbuds',
    'earphones',
    'armbands',
    'bluetooth_speaker',
    'waterproof_phone_pouch',
    'screen_protectors',
    'smartwatch',
    'fitness_tracker',
    'microsd_card',
    'selfie_stick',
    'car_holder',
    'wireless_charger',
    'screen_protector'
);


ALTER TYPE public.tipuri_produse OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 24780)
-- Name: accesari; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accesari (
    id integer NOT NULL,
    ip character varying(100) NOT NULL,
    user_id integer,
    pagina character varying(500) NOT NULL,
    data_accesare timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.accesari OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 24779)
-- Name: accesari_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.accesari_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.accesari_id_seq OWNER TO postgres;

--
-- TOC entry 3364 (class 0 OID 0)
-- Dependencies: 215
-- Name: accesari_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accesari_id_seq OWNED BY public.accesari.id;


--
-- TOC entry 212 (class 1259 OID 24724)
-- Name: accessories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accessories (
    id integer NOT NULL,
    nume character varying(50) NOT NULL,
    descriere text,
    pret numeric(8,2) NOT NULL,
    discount integer NOT NULL,
    tip_produs public.tipuri_produse,
    categorie public.categ_accesorii,
    materiale character varying[],
    returnable boolean DEFAULT false NOT NULL,
    imagine character varying(300),
    data_adaugare timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    color character varying,
    CONSTRAINT accessories_discount_check CHECK ((discount >= 0))
);


ALTER TABLE public.accessories OWNER TO postgres;

--
-- TOC entry 211 (class 1259 OID 24723)
-- Name: accessories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.accessories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.accessories_id_seq OWNER TO postgres;

--
-- TOC entry 3366 (class 0 OID 0)
-- Dependencies: 211
-- Name: accessories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.accessories_id_seq OWNED BY public.accessories.id;


--
-- TOC entry 210 (class 1259 OID 24578)
-- Name: produse; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.produse (
    id integer NOT NULL,
    nume character varying(100) NOT NULL,
    pret double precision DEFAULT 10 NOT NULL
);


ALTER TABLE public.produse OWNER TO postgres;

--
-- TOC entry 209 (class 1259 OID 24577)
-- Name: produse_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.produse ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.produse_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 214 (class 1259 OID 24766)
-- Name: utilizatori; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utilizatori (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    nume character varying(100) NOT NULL,
    prenume character varying(100) NOT NULL,
    parola character varying(500) NOT NULL,
    rol public.roluri DEFAULT 'comun'::public.roluri NOT NULL,
    email character varying(100) NOT NULL,
    culoare_chat character varying(50) NOT NULL,
    data_adaugare timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cod character varying(200),
    confirmat_mail boolean DEFAULT false
);

ALTER TABLE public.utilizatori add column ocupatie character varying(100);
ALTER TABLE public.utilizatori add column cale_imagine character varying(200);


ALTER TABLE public.utilizatori OWNER TO postgres;

--
-- TOC entry 213 (class 1259 OID 24765)
-- Name: utilizatori_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.utilizatori_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.utilizatori_id_seq OWNER TO postgres;

--
-- TOC entry 3370 (class 0 OID 0)
-- Dependencies: 213
-- Name: utilizatori_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.utilizatori_id_seq OWNED BY public.utilizatori.id;


--
-- TOC entry 3197 (class 2604 OID 24783)
-- Name: accesari id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accesari ALTER COLUMN id SET DEFAULT nextval('public.accesari_id_seq'::regclass);


--
-- TOC entry 3189 (class 2604 OID 24727)
-- Name: accessories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accessories ALTER COLUMN id SET DEFAULT nextval('public.accessories_id_seq'::regclass);


--
-- TOC entry 3193 (class 2604 OID 24769)
-- Name: utilizatori id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilizatori ALTER COLUMN id SET DEFAULT nextval('public.utilizatori_id_seq'::regclass);


--
-- TOC entry 3358 (class 0 OID 24780)
-- Dependencies: 216
-- Data for Name: accesari; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 3354 (class 0 OID 24724)
-- Dependencies: 212
-- Data for Name: accessories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (2, 'Pop-Socket', 'Perfect pop socket for your phone', 60.00, 0, 'pop-sockets', 'phone_cases_and_screen_protectors', '{plastic,silicon}', false, 'pop_socket.jpg
', '2022-03-28 17:17:00.770979', 'white');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (6, 'Bluetooth Speaker', 'Share the music you enjoy the most with friends using this modern Bluetooth Speaker', 350.00, 0, 'bluetooth_speaker', 'tech_accessories', '{metal,pastic,rubber}', true, 'bt_speaker.jpg', '2022-04-06 09:23:26.520187', 'blue');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (3, 'Phone Charger', 'Fast phone charger ', 90.00, 5, 'chargers', 'tech_accessories', '{copper,plastic,rubber}', false, 'phone_charger.png
', '2022-03-28 17:17:00.770979', 'white');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (10, 'Car Phone Holder', 'Keep your phone in pace while driving SAFELY', 100.00, 30, 'car_holder', 'phone_holders_and_waterproof_bags', '{metal,rubber,plastic}', false, 'car_holder.png', '2022-04-06 14:46:49.191969', 'black');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (17, 'Smartwatch', 'Know exactly what time is it, access your phone remotely and look stylish at the same time', 300.00, 30, 'smartwatch', 'tech_accessories', '{metal,rubber,plastic,glass}', true, 'smartwatch.jpg', '2022-04-06 14:46:49.191969', 'white');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (11, 'White Earphones', 'Listen to music clearly with this pair of earphones designed for everyone', 120.00, 0, 'earphones', 'tech_accessories', '{metal,rubber,plastic}', true, 'earphones.jpg', '2022-04-06 14:46:49.191969', 'white');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (1, 'iPhone Case', 'Beautiful iPhone case', 100.00, 10, 'phone_cases', 'phone_cases_and_screen_protectors', '{plastic,metal}', false, 'iphone_case.jpg', '2022-03-28 17:17:00.770979', 'black');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (5, 'Earbuds', 'Best earbuds that you can get at the time', 300.00, 10, 'earbuds', 'tech_accessories', '{metal,plastic}', true, 'earbuds.png
', '2022-03-28 17:17:00.770979', 'pink');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (7, 'Selfie Stick', 'Capture the best moments of your life with the help of this amazing selfie stick', 80.00, 20, 'selfie_stick', 'tech_accessories', '{metal,rubber}', true, 'selfie_stick.jpg', '2022-04-06 14:46:49.191969', 'black');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (8, '128 GB MicroSD Card', 'Store your images, videos or other files on this MicroSD Card', 150.00, 15, 'microsd_card', 'tech_accessories', '{plastic,metal}', true, 'microsd_card.jpg', '2022-04-06 14:46:49.191969', 'black');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (9, 'White Wireless Charger', 'Embrace the innovation with our brand new wireless charger', 250.00, 20, 'wireless_charger', 'tech_accessories', '{plastic,rubber,metal}', false, 'wireless_charger.jpg', '2022-04-06 14:46:49.191969', 'white');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (12, 'Mini Car Phone Holder', 'Keep your phone safe and cool with the help of our mini car phone holder', 75.00, 5, 'car_holder', 'phone_holders_and_waterproof_bags', '{metal,rubber,plastic}', false, 'mini_car_holder.jpg', '2022-04-06 14:46:49.191969', 'grey');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (16, 'Ultra Ressistant Phone Case', 'Our Ultra Ressistant Phone Case offers you the hightest level of phone protection possible', 100.00, 0, 'phone_cases', 'phone_cases_and_screen_protectors', '{silicon,plastic}', false, 'ultra_res_phone_case.jpg', '2022-04-06 14:46:49.191969', 'black');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (18, 'Fitness Tracker', 'Our fitness tracker helps you stay in shape and monitor your health in real time', 200.00, 15, 'fitness_tracker', 'tech_accessories', '{metal,rubber,glass,plastic}', true, 'fitness_tracker.jpg', '2022-04-06 14:46:49.191969', 'black');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (19, '3x Waterproof Phone Pouches', 'Enjoy the beauty of the underwater life and keep your phone away from water', 70.00, 0, 'waterproof_phone_pouch', 'phone_holders_and_waterproof_bags', '{plastic,rubber}', false, 'waterproof_pouch.jpg', '2022-04-06 14:46:49.191969', 'black');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (20, 'Ultra Slim Phone Case', 'The Ultra Slim Phone Case lets you enjoy the natural shape of your phone while protecting it from scratches, cracks and shocks', 50.00, 10, 'phone_cases', 'phone_cases_and_screen_protectors', '{silicon,plastic}', false, 'ultra_slim_phone_case.jpg', '2022-04-06 14:46:49.191969', 'black');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (13, 'Glass Screen Protectors', 'Keep scratches and cracks away from your phone screen, let a screen protector do the job', 50.00, 10, 'screen_protector', 'phone_cases_and_screen_protectors', '{glass}', false, 'glass_screen_protector.jpg', '2022-04-06 14:46:49.191969', 'transparent');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (14, 'Privacy Screen Protector', 'Stay incognito in public using this privacy screen protector that will not let strangers look into your phone', 80.00, 20, 'screen_protector', 'phone_cases_and_screen_protectors', '{glass}', false, 'privacy_screen_protector.jpg', '2022-04-06 14:46:49.191969', 'transparent');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (15, 'Plastic Screen Protector', 'Scratches will not touch your phone if you start using our newly engeneered plastic screen protector', 20.00, 50, 'screen_protector', 'phone_cases_and_screen_protectors', '{plastic}', false, 'plastic_screen_protector.jpg', '2022-04-06 14:46:49.191969', 'transparent');
INSERT INTO public.accessories (id, nume, descriere, pret, discount, tip_produs, categorie, materiale, returnable, imagine, data_adaugare, color) VALUES (4, 'Armband', 'Perfect armband for your phone during intense sessions of jogging', 50.00, 0, 'armbands', 'phone_holders_and_waterproof_bags', '{plastic,textile}', false, 'armband.png
', '2022-03-28 17:17:00.770979', 'cyan');


--
-- TOC entry 3352 (class 0 OID 24578)
-- Dependencies: 210
-- Data for Name: produse; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.produse (id, nume, pret) OVERRIDING SYSTEM VALUE VALUES (1, 'monitor', 500);
INSERT INTO public.produse (id, nume, pret) OVERRIDING SYSTEM VALUE VALUES (2, 'mouse', 150);
INSERT INTO public.produse (id, nume, pret) OVERRIDING SYSTEM VALUE VALUES (3, 'covrig', 10);
INSERT INTO public.produse (id, nume, pret) OVERRIDING SYSTEM VALUE VALUES (4, 'bomboana', 5);
INSERT INTO public.produse (id, nume, pret) OVERRIDING SYSTEM VALUE VALUES (5, 'marker', 10);


--
-- TOC entry 3356 (class 0 OID 24766)
-- Dependencies: 214
-- Data for Name: utilizatori; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- TOC entry 3371 (class 0 OID 0)
-- Dependencies: 215
-- Name: accesari_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accesari_id_seq', 1, false);


--
-- TOC entry 3372 (class 0 OID 0)
-- Dependencies: 211
-- Name: accessories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.accessories_id_seq', 20, true);


--
-- TOC entry 3373 (class 0 OID 0)
-- Dependencies: 209
-- Name: produse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.produse_id_seq', 5, true);


--
-- TOC entry 3374 (class 0 OID 0)
-- Dependencies: 213
-- Name: utilizatori_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.utilizatori_id_seq', 1, false);


--
-- TOC entry 3210 (class 2606 OID 24788)
-- Name: accesari accesari_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accesari
    ADD CONSTRAINT accesari_pkey PRIMARY KEY (id);


--
-- TOC entry 3202 (class 2606 OID 24736)
-- Name: accessories accessories_nume_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accessories
    ADD CONSTRAINT accessories_nume_key UNIQUE (nume);


--
-- TOC entry 3204 (class 2606 OID 24734)
-- Name: accessories accessories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accessories
    ADD CONSTRAINT accessories_pkey PRIMARY KEY (id);


--
-- TOC entry 3200 (class 2606 OID 24583)
-- Name: produse produse_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produse
    ADD CONSTRAINT produse_pkey PRIMARY KEY (id);


--
-- TOC entry 3206 (class 2606 OID 24776)
-- Name: utilizatori utilizatori_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilizatori
    ADD CONSTRAINT utilizatori_pkey PRIMARY KEY (id);


--
-- TOC entry 3208 (class 2606 OID 24778)
-- Name: utilizatori utilizatori_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utilizatori
    ADD CONSTRAINT utilizatori_username_key UNIQUE (username);


--
-- TOC entry 3211 (class 2606 OID 24789)
-- Name: accesari accesari_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accesari
    ADD CONSTRAINT accesari_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.utilizatori(id);


--
-- TOC entry 3365 (class 0 OID 0)
-- Dependencies: 212
-- Name: TABLE accessories; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.accessories TO test_user;


--
-- TOC entry 3367 (class 0 OID 0)
-- Dependencies: 211
-- Name: SEQUENCE accessories_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.accessories_id_seq TO test_user;


--
-- TOC entry 3368 (class 0 OID 0)
-- Dependencies: 210
-- Name: TABLE produse; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.produse TO test_user;


--
-- TOC entry 3369 (class 0 OID 0)
-- Dependencies: 209
-- Name: SEQUENCE produse_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.produse_id_seq TO test_user;


-- Completed on 2022-04-13 11:39:32

--
-- PostgreSQL database dump complete
--

