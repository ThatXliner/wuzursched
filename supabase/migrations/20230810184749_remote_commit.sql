CREATE TABLE "public"."classes" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "teacher_first" "text" NOT NULL,
    "teacher_last" "text" NOT NULL,
    "room" "uuid" NOT NULL
);

ALTER TABLE "public"."classes" OWNER TO "postgres";

CREATE TABLE "public"."rooms" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "public"."rooms" OWNER TO "postgres";

CREATE TABLE "public"."schedules" (
    "room" "uuid" NOT NULL,
    "student" "text" NOT NULL,
    "1a" "uuid" NOT NULL,
    "2a" "uuid" NOT NULL,
    "3a" "uuid" NOT NULL,
    "4a" "uuid" NOT NULL,
    "1b" "uuid" NOT NULL,
    "2b" "uuid" NOT NULL,
    "3b" "uuid" NOT NULL,
    "4b" "uuid" NOT NULL
);

ALTER TABLE "public"."schedules" OWNER TO "postgres";

ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_name_teacher_first_teacher_last_room_key" UNIQUE ("name", "teacher_first", "teacher_last", "room");

ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."rooms"
    ADD CONSTRAINT "rooms_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_pkey" PRIMARY KEY ("student", "room");

ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_student_key" UNIQUE ("student");

ALTER TABLE ONLY "public"."classes"
    ADD CONSTRAINT "classes_room_fkey" FOREIGN KEY ("room") REFERENCES "public"."rooms"("id");

ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_1a_fkey" FOREIGN KEY ("1a") REFERENCES "public"."classes"("id");

ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_1b_fkey" FOREIGN KEY ("1b") REFERENCES "public"."classes"("id");

ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_2a_fkey" FOREIGN KEY ("2a") REFERENCES "public"."classes"("id");

ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_2b_fkey" FOREIGN KEY ("2b") REFERENCES "public"."classes"("id");

ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_3a_fkey" FOREIGN KEY ("3a") REFERENCES "public"."classes"("id");

ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_3b_fkey" FOREIGN KEY ("3b") REFERENCES "public"."classes"("id");

ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_4a_fkey" FOREIGN KEY ("4a") REFERENCES "public"."classes"("id");

ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_4b_fkey" FOREIGN KEY ("4b") REFERENCES "public"."classes"("id");

ALTER TABLE ONLY "public"."schedules"
    ADD CONSTRAINT "schedules_room_fkey" FOREIGN KEY ("room") REFERENCES "public"."rooms"("id");

CREATE POLICY "Allow insert access for all users" ON "public"."rooms" FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insertion for all users" ON "public"."classes" FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable insertion for all users" ON "public"."schedules" FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable read access for all users" ON "public"."classes" FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON "public"."schedules" FOR SELECT USING (true);

ALTER TABLE "public"."classes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."rooms" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."schedules" ENABLE ROW LEVEL SECURITY;

REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

GRANT ALL ON TABLE "public"."classes" TO "anon";
GRANT ALL ON TABLE "public"."classes" TO "authenticated";
GRANT ALL ON TABLE "public"."classes" TO "service_role";

GRANT ALL ON TABLE "public"."rooms" TO "anon";
GRANT ALL ON TABLE "public"."rooms" TO "authenticated";
GRANT ALL ON TABLE "public"."rooms" TO "service_role";

GRANT ALL ON TABLE "public"."schedules" TO "anon";
GRANT ALL ON TABLE "public"."schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."schedules" TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";

RESET ALL;
