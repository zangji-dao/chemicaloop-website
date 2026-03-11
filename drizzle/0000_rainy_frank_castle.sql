CREATE TABLE "agent_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid,
	"link_code" varchar(20) NOT NULL,
	"custom_contact_info" text,
	"clicks" integer DEFAULT 0,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "agent_links_link_code_key" UNIQUE("link_code")
);
--> statement-breakpoint
CREATE TABLE "agent_products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"spu_id" uuid,
	"cas" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"agent_id" uuid NOT NULL,
	"purity" varchar(50),
	"package_spec" varchar(100),
	"price" numeric(10, 2),
	"min_order" integer,
	"stock" integer,
	"stock_public" boolean DEFAULT true,
	"origin" varchar(100),
	"remark" text,
	"translations" jsonb DEFAULT '{}'::jsonb,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"review_note" text,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"image_key" text,
	"catalog_id" uuid,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_en" varchar(255) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "contact_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"contact_user_id" uuid NOT NULL,
	"contact_request_id" uuid,
	"contact_details" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contact_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"receiver_id" uuid NOT NULL,
	"message_id" varchar(255),
	"requested_contact_ids" jsonb DEFAULT '[]'::jsonb,
	"requester_shared_contacts" jsonb DEFAULT '{}'::jsonb,
	"message" text,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"responded_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customs_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"year_month" varchar(6) NOT NULL,
	"year" integer NOT NULL,
	"month" integer NOT NULL,
	"hs_code" varchar(10) NOT NULL,
	"product_name" varchar(255),
	"partner_code" varchar(10) NOT NULL,
	"partner_name" varchar(100) NOT NULL,
	"trade_mode_code" varchar(10) NOT NULL,
	"trade_mode_name" varchar(50) NOT NULL,
	"region_code" varchar(10) NOT NULL,
	"region_name" varchar(50) NOT NULL,
	"flow_code" varchar(10),
	"flow_name" varchar(50),
	"value" numeric(15, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"sender_name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"smtp_host" varchar(255) NOT NULL,
	"smtp_port" integer NOT NULL,
	"imap_host" varchar(255),
	"imap_port" integer,
	"use_tls" boolean DEFAULT true,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inquiries" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(36) NOT NULL,
	"product_id" varchar(36) NOT NULL,
	"product_name" varchar(255) NOT NULL,
	"specifications" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit" varchar(20) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"replied_by" varchar(255),
	"replied_by_user_id" varchar(36),
	"reply_content" text,
	"supplier_name" varchar(255),
	"supplier_phone" varchar(50),
	"supplier_email" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"replied_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"type" varchar(20) DEFAULT 'inquiry' NOT NULL,
	"folder" varchar(20) DEFAULT 'inbox' NOT NULL,
	"title" varchar(500) NOT NULL,
	"content" text NOT NULL,
	"sender_id" uuid,
	"sender_name" varchar(255),
	"sender_address" varchar(255),
	"recipient_id" uuid,
	"recipient_name" varchar(255),
	"recipient_address" varchar(255),
	"product_id" uuid,
	"product_name" varchar(255),
	"cas" varchar(100),
	"quantity" varchar(100),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"unread" boolean DEFAULT true,
	"starred" boolean DEFAULT false,
	"deleted" boolean DEFAULT false,
	"archived" boolean DEFAULT false,
	"reply_content" text,
	"reply_from" varchar(255),
	"reply_address" varchar(255),
	"reply_contact" jsonb,
	"auto_saved_at" timestamp,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"sent_at" timestamp,
	"read_at" timestamp,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"translations" jsonb DEFAULT '{}'::jsonb,
	"language" varchar(10) DEFAULT 'en'
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(100) NOT NULL,
	"title" varchar(255) NOT NULL,
	"content" text,
	"data" jsonb DEFAULT '{}'::jsonb,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "password_reset_tokens_token_key" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cas" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"name_en" varchar(255),
	"formula" varchar(100),
	"description" text,
	"image_url" text,
	"status" varchar(20) DEFAULT 'ACTIVE',
	"pubchem_cid" integer,
	"pubchem_data_source" varchar(50),
	"pubchem_synced_at" timestamp with time zone,
	"molecular_weight" varchar(50),
	"exact_mass" varchar(50),
	"smiles" text,
	"smiles_canonical" text,
	"smiles_isomeric" text,
	"inchi" text,
	"inchi_key" varchar(50),
	"xlogp" varchar(20),
	"tpsa" varchar(20),
	"complexity" integer,
	"h_bond_donor_count" integer,
	"h_bond_acceptor_count" integer,
	"rotatable_bond_count" integer,
	"heavy_atom_count" integer,
	"formal_charge" integer,
	"stereo_center_count" integer,
	"undefined_stereo_center_count" integer,
	"isotope_atom_count" integer,
	"physical_description" text,
	"color_form" varchar(255),
	"odor" varchar(255),
	"boiling_point" varchar(200),
	"melting_point" varchar(200),
	"flash_point" varchar(200),
	"density" varchar(50),
	"solubility" text,
	"vapor_pressure" varchar(100),
	"refractive_index" varchar(50),
	"pKa" varchar(50),
	"henry_law_constant" varchar(100),
	"auto_ignition_temp" varchar(50),
	"decomposition_temp" varchar(50),
	"surface_tension" varchar(50),
	"hazard_classes" text,
	"health_hazards" text,
	"ghs_classification" text,
	"toxicity_summary" text,
	"carcinogenicity" text,
	"first_aid" text,
	"storage_conditions" text,
	"incompatible_materials" text,
	"structure_url" text,
	"structure_image_key" text,
	"structure_2d_svg" text,
	"structure_3d_url" text,
	"product_image_key" text,
	"product_image_generated_at" timestamp with time zone,
	"synonyms" jsonb,
	"applications" jsonb DEFAULT '[]'::jsonb,
	"categories" jsonb DEFAULT '[]'::jsonb,
	"hs_code" varchar(20),
	"hs_code_source" varchar(20),
	"hs_code_6" varchar(10),
	"hs_code_extensions" jsonb DEFAULT '{}'::jsonb,
	"translations" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "products_cas_unique" UNIQUE("cas")
);
--> statement-breakpoint
CREATE TABLE "social_contact_types" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL,
	"name_en" varchar(50) NOT NULL,
	"icon" varchar(50),
	"placeholder" varchar(50),
	"placeholder_en" varchar(50),
	"validation_regex" varchar(100),
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "spu_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"cas" varchar(50) NOT NULL,
	"user_id" uuid NOT NULL,
	"user_email" varchar(255),
	"user_name" varchar(255),
	"reason" varchar(50),
	"reason_detail" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reject_reason" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "system_configs" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" jsonb NOT NULL,
	"description" text,
	"category" varchar(50) DEFAULT 'general' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "system_configs_key_key" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "test_table" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "trade_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cas" varchar(50) NOT NULL,
	"hs_code" varchar(10) NOT NULL,
	"product_name" varchar(255),
	"product_name_en" varchar(255),
	"reporter_code" varchar(10) NOT NULL,
	"reporter_name" varchar(100),
	"reporter_name_en" varchar(100),
	"partner_code" varchar(10) DEFAULT '0' NOT NULL,
	"partner_name" varchar(100),
	"partner_name_en" varchar(100),
	"year" integer NOT NULL,
	"flow_code" varchar(5) NOT NULL,
	"flow_name" varchar(20),
	"value" numeric(18, 2) DEFAULT '0' NOT NULL,
	"quantity" numeric(18, 2),
	"unit_price" numeric(10, 4),
	"data_source" varchar(50) DEFAULT 'un-comtrade',
	"raw_data" jsonb,
	"synced_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "trade_data_unique" UNIQUE("cas","reporter_code","partner_code","year","flow_code")
);
--> statement-breakpoint
CREATE TABLE "trade_data_sync_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cas_list" jsonb NOT NULL,
	"reporter_codes" jsonb NOT NULL,
	"year_range" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"progress" integer DEFAULT 0,
	"total_items" integer DEFAULT 0,
	"processed_items" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"error_log" jsonb,
	"triggered_by" uuid NOT NULL,
	"triggered_at" timestamp with time zone DEFAULT now(),
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"external_email" varchar(255),
	"external_email_verified" boolean DEFAULT false,
	"country" varchar(100),
	"city" varchar(100),
	"address" text,
	"wechat" varchar(50),
	"whatsapp" varchar(50),
	"telegram" varchar(100),
	"messenger" varchar(100),
	"skype" varchar(100),
	"qq" varchar(50),
	"line" varchar(100),
	"viber" varchar(100),
	"instagram" varchar(100),
	"linkedin" varchar(100),
	"tiktok" varchar(100),
	"quick_email" varchar(255),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_social_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"contact_type_id" varchar(20) NOT NULL,
	"contact_value" varchar(100) NOT NULL,
	"is_verified" boolean DEFAULT false,
	"is_visible_in_circle" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_social_contacts_user_id_contact_type_id_key" UNIQUE("user_id","contact_type_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"username" varchar(50),
	"internal_email" varchar(255),
	"avatar_url" text,
	"role" varchar(50) DEFAULT 'USER' NOT NULL,
	"verified" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp DEFAULT CURRENT_TIMESTAMP,
	"google_id" varchar(255),
	"facebook_id" varchar(255),
	"apple_id" varchar(255),
	CONSTRAINT "users_email_key" UNIQUE("email"),
	CONSTRAINT "users_google_id_key" UNIQUE("google_id"),
	CONSTRAINT "users_facebook_id_key" UNIQUE("facebook_id"),
	CONSTRAINT "users_apple_id_key" UNIQUE("apple_id"),
	CONSTRAINT "users_username_key" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"code" varchar(6) NOT NULL,
	"type" varchar(20) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false,
	"created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE "agent_links" ADD CONSTRAINT "agent_links_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_products" ADD CONSTRAINT "agent_products_spu_id_products_id_fk" FOREIGN KEY ("spu_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_products" ADD CONSTRAINT "agent_products_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_members" ADD CONSTRAINT "contact_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_members" ADD CONSTRAINT "contact_members_contact_user_id_fkey" FOREIGN KEY ("contact_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_members" ADD CONSTRAINT "contact_members_contact_request_id_fkey" FOREIGN KEY ("contact_request_id") REFERENCES "public"."contact_requests"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_requests" ADD CONSTRAINT "contact_requests_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_accounts" ADD CONSTRAINT "email_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."agent_products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spu_requests" ADD CONSTRAINT "fk_spu_requests_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_data_sync_tasks" ADD CONSTRAINT "trade_data_sync_tasks_triggered_by_fkey" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_social_contacts" ADD CONSTRAINT "user_social_contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_social_contacts" ADD CONSTRAINT "user_social_contacts_contact_type_id_fkey" FOREIGN KEY ("contact_type_id") REFERENCES "public"."social_contact_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_agent_products_agent_id" ON "agent_products" USING btree ("agent_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_agent_products_spu_id" ON "agent_products" USING btree ("spu_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_agent_products_cas" ON "agent_products" USING btree ("cas" text_ops);--> statement-breakpoint
CREATE INDEX "idx_agent_products_status" ON "agent_products" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_contact_members_contact_user" ON "contact_members" USING btree ("contact_user_id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "idx_contact_members_unique" ON "contact_members" USING btree ("user_id" uuid_ops,"contact_user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contact_members_user" ON "contact_members" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contact_requests_created_at" ON "contact_requests" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_contact_requests_receiver" ON "contact_requests" USING btree ("receiver_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contact_requests_requester" ON "contact_requests" USING btree ("requester_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_contact_requests_status" ON "contact_requests" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_customs_data_year_month" ON "customs_data" USING btree ("year_month" text_ops);--> statement-breakpoint
CREATE INDEX "idx_customs_data_hs_code" ON "customs_data" USING btree ("hs_code" text_ops);--> statement-breakpoint
CREATE INDEX "idx_customs_data_partner" ON "customs_data" USING btree ("partner_code" text_ops);--> statement-breakpoint
CREATE INDEX "idx_customs_data_region" ON "customs_data" USING btree ("region_code" text_ops);--> statement-breakpoint
CREATE INDEX "idx_email_accounts_user_id" ON "email_accounts" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_email_accounts_email" ON "email_accounts" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "inquiries_status_idx" ON "inquiries" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "inquiries_user_idx" ON "inquiries" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_messages_created_at" ON "messages" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_messages_folder" ON "messages" USING btree ("folder" text_ops);--> statement-breakpoint
CREATE INDEX "idx_messages_recipient" ON "messages" USING btree ("recipient_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_messages_sender" ON "messages" USING btree ("sender_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_messages_status" ON "messages" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_messages_type" ON "messages" USING btree ("type" text_ops);--> statement-breakpoint
CREATE INDEX "idx_messages_unread" ON "messages" USING btree ("unread" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_messages_user" ON "messages" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_notifications_created_at" ON "notifications" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_notifications_is_read" ON "notifications" USING btree ("is_read" bool_ops);--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_password_reset_tokens_expires" ON "password_reset_tokens" USING btree ("expires_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_password_reset_tokens_token" ON "password_reset_tokens" USING btree ("token" text_ops);--> statement-breakpoint
CREATE INDEX "idx_password_reset_tokens_user_id" ON "password_reset_tokens" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_products_cas" ON "products" USING btree ("cas" text_ops);--> statement-breakpoint
CREATE INDEX "idx_products_pubchem_cid" ON "products" USING btree ("pubchem_cid" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_products_hs_code" ON "products" USING btree ("hs_code" text_ops);--> statement-breakpoint
CREATE INDEX "idx_products_name_en" ON "products" USING btree ("name_en" text_ops);--> statement-breakpoint
CREATE INDEX "idx_spu_requests_cas" ON "spu_requests" USING btree ("cas" text_ops);--> statement-breakpoint
CREATE INDEX "idx_spu_requests_status" ON "spu_requests" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_spu_requests_user_id" ON "spu_requests" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_trade_data_cas_reporter_year" ON "trade_data" USING btree ("cas" text_ops,"reporter_code" text_ops,"year" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_trade_data_hs_code" ON "trade_data" USING btree ("hs_code" text_ops);--> statement-breakpoint
CREATE INDEX "idx_trade_data_year" ON "trade_data" USING btree ("year" int4_ops);--> statement-breakpoint
CREATE INDEX "idx_trade_data_sync_tasks_status" ON "trade_data_sync_tasks" USING btree ("status" text_ops);--> statement-breakpoint
CREATE INDEX "idx_trade_data_sync_tasks_triggered_by" ON "trade_data_sync_tasks" USING btree ("triggered_by" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_user_profiles_user_id" ON "user_profiles" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_user_social_contacts_user_id" ON "user_social_contacts" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_users_apple_id" ON "users" USING btree ("apple_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email" text_ops);--> statement-breakpoint
CREATE INDEX "idx_users_facebook_id" ON "users" USING btree ("facebook_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_users_google_id" ON "users" USING btree ("google_id" text_ops);--> statement-breakpoint
CREATE INDEX "idx_users_username" ON "users" USING btree ("username" text_ops);--> statement-breakpoint
CREATE INDEX "idx_verification_codes_email" ON "verification_codes" USING btree ("email" text_ops);