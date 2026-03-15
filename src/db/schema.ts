import { pgTable, index, varchar, text, integer, timestamp, uuid, boolean, unique, foreignKey, numeric, jsonb, serial, uniqueIndex } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const inquiries = pgTable("inquiries", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: varchar("user_id", { length: 36 }).notNull(),
	productId: varchar("product_id", { length: 36 }).notNull(),
	productName: varchar("product_name", { length: 255 }).notNull(),
	specifications: text().notNull(),
	quantity: integer().notNull(),
	unit: varchar({ length: 20 }).notNull(),
	status: varchar({ length: 20 }).default('pending').notNull(),
	repliedBy: varchar("replied_by", { length: 255 }),
	repliedByUserId: varchar("replied_by_user_id", { length: 36 }),
	replyContent: text("reply_content"),
	supplierName: varchar("supplier_name", { length: 255 }),
	supplierPhone: varchar("supplier_phone", { length: 50 }),
	supplierEmail: varchar("supplier_email", { length: 255 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }),
	repliedAt: timestamp("replied_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("inquiries_status_idx").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("inquiries_user_idx").using("btree", table.userId.asc().nullsLast().op("text_ops")),
]);

export const verificationCodes = pgTable("verification_codes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	code: varchar({ length: 6 }).notNull(),
	type: varchar({ length: 20 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	used: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_verification_codes_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: varchar("password_hash", { length: 255 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	username: varchar({ length: 50 }),
	internalEmail: varchar("internal_email", { length: 255 }),
	avatarUrl: text("avatar_url"),
	role: varchar({ length: 50 }).default('USER').notNull(),
	verified: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	googleId: varchar("google_id", { length: 255 }),
	facebookId: varchar("facebook_id", { length: 255 }),
	appleId: varchar("apple_id", { length: 255 }),
}, (table) => [
	index("idx_users_apple_id").using("btree", table.appleId.asc().nullsLast().op("text_ops")),
	index("idx_users_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_users_facebook_id").using("btree", table.facebookId.asc().nullsLast().op("text_ops")),
	index("idx_users_google_id").using("btree", table.googleId.asc().nullsLast().op("text_ops")),
	index("idx_users_username").using("btree", table.username.asc().nullsLast().op("text_ops")),
	unique("users_email_key").on(table.email),
	unique("users_google_id_key").on(table.googleId),
	unique("users_facebook_id_key").on(table.facebookId),
	unique("users_apple_id_key").on(table.appleId),
	unique("users_username_key").on(table.username),
]);

export const categories = pgTable("categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	nameEn: varchar("name_en", { length: 255 }).notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

// SPU 表 - 标准产品单位（CAS码唯一）
// 数据主要来源于 PubChem，字段命名遵循 PubChem 数据结构
export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	
	// ========== 基础标识信息 ==========
	cas: varchar({ length: 100 }).notNull().unique(),           // CAS 号（唯一标识）
	name: varchar({ length: 255 }).notNull(),                   // 中文名称
	nameEn: varchar("name_en", { length: 255 }),                // 英文名称（IUPAC Name）
	formula: varchar({ length: 100 }),                          // 分子式
	description: text(),                                        // 产品描述
	imageUrl: text("image_url"),                                // 产品图片 URL
	status: varchar({ length: 20 }).default('ACTIVE'),          // 状态
	
	// ========== PubChem 基础信息 ==========
	pubchemCid: integer("pubchem_cid"),                         // PubChem Compound ID
	pubchemDataSource: varchar("pubchem_data_source", { length: 50 }), // 数据来源: 'pubchem', 'manual', 'hybrid'
	pubchemSyncedAt: timestamp("pubchem_synced_at", { withTimezone: true, mode: 'string' }),
	
	// ========== PubChem 标识符 ==========
	molecularWeight: varchar("molecular_weight", { length: 50 }), // 分子量
	exactMass: varchar("exact_mass", { length: 50 }),            // 精确质量
	smiles: text(),                                              // SMILES 字符串
	smilesCanonical: text("smiles_canonical"),                   // 规范化 SMILES
	smilesIsomeric: text("smiles_isomeric"),                     // 异构 SMILES
	inchi: text(),                                               // InChI 标识符
	inchiKey: varchar("inchi_key", { length: 50 }),              // InChI Key
	
	// ========== PubChem 计算属性 (Computed Properties) ==========
	xlogp: varchar({ length: 20 }),                              // XLogP3 (辛醇-水分配系数)
	tpsa: varchar({ length: 20 }),                               // 拓扑极性表面积
	complexity: integer(),                                        // 复杂度
	hBondDonorCount: integer("h_bond_donor_count"),              // 氢键供体数
	hBondAcceptorCount: integer("h_bond_acceptor_count"),        // 氢键受体数
	rotatableBondCount: integer("rotatable_bond_count"),         // 可旋转键数
	heavyAtomCount: integer("heavy_atom_count"),                 // 重原子数
	formalCharge: integer("formal_charge"),                       // 形式电荷
	stereoCenterCount: integer("stereo_center_count"),           // 立体中心数
	undefinedStereoCenterCount: integer("undefined_stereo_center_count"), // 未定义立体中心数
	isotopeAtomCount: integer("isotope_atom_count"),             // 同位素原子数
	
	// ========== PubChem 物理化学性质 (Experimental Properties) ==========
	physicalDescription: text("physical_description"),            // 物理描述（颜色、形态等）
	colorForm: varchar("color_form", { length: 255 }),           // 颜色/形态
	odor: varchar({ length: 255 }),                               // 气味
	boilingPoint: varchar("boiling_point", { length: 200 }),     // 沸点
	meltingPoint: varchar("melting_point", { length: 200 }),     // 熔点
	flashPoint: varchar("flash_point", { length: 200 }),         // 闪点
	density: text(),                                              // 密度（可能包含描述性文字）
	solubility: text(),                                           // 溶解度
	vaporPressure: varchar("vapor_pressure", { length: 100 }),   // 蒸气压
	refractiveIndex: varchar("refractive_index", { length: 100 }), // 折射率（可能包含温度信息）
	pKa: varchar("pka", { length: 100 }),                            // 解离常数
	henryLawConstant: varchar("henry_law_constant", { length: 100 }), // 亨利定律常数
	autoIgnitionTemp: varchar("auto_ignition_temp", { length: 100 }), // 自燃温度
	decompositionTemp: varchar("decomposition_temp", { length: 100 }), // 分解温度
	surfaceTension: varchar("surface_tension", { length: 100 }), // 表面张力
	
	// ========== PubChem 安全与毒性信息 ==========
	hazardClasses: text("hazard_classes"),                        // 危险类别
	healthHazards: text("health_hazards"),                        // 健康危害
	ghsClassification: text("ghs_classification"),               // GHS 分类（信号词、危险说明等）
	toxicitySummary: text("toxicity_summary"),                    // 毒性概述
	carcinogenicity: text(),                                      // 致癌性
	firstAid: text("first_aid"),                                  // 急救措施
	storageConditions: text("storage_conditions"),                // 存储条件
	incompatibleMaterials: text("incompatible_materials"),        // 不相容物质
	
	// ========== PubChem 结构图片 ==========
	structureUrl: text("structure_url"),                          // PubChem 2D 结构图片 URL（临时）
	structureImageKey: text("structure_image_key"),               // 对象存储 2D 结构图 key
	structureSdf: text("structure_sdf"),                          // SDF 结构数据（用于重绘）
	structure2dSvg: text("structure_2d_svg"),                     // 2D SVG 结构数据
	structure3dUrl: text("structure_3d_url"),                     // 3D 结构 URL
	
	// ========== 产品图（重绘生成）==========
	productImageKey: text("product_image_key"),                   // 对象存储 key
	productImageGeneratedAt: timestamp("product_image_generated_at", { withTimezone: true, mode: 'string' }),
	
	// ========== 同义词与应用 ==========
	synonyms: jsonb().$type<string[]>(),                          // 同义词列表
	applications: jsonb().$type<string[]>().default([]),          // 行业应用
	categories: jsonb().$type<string[]>().default([]),            // 分类标签
	
	// ========== HS 海关编码 ==========
	hsCode: varchar("hs_code", { length: 20 }),                   // HS 编码（6位基础码）
	hsCodeExtensions: jsonb("hs_code_extensions").$type<Record<string, string>>().default({}), // 各国扩展码
	
	// ========== 多语言翻译 ==========
	translations: jsonb("translations").$type<{
		name?: Record<string, string>;           // 产品名称多语言
		description?: Record<string, string>;    // 描述多语言
		applications?: Record<string, string[]>; // 应用多语言
		synonyms?: Record<string, string[]>;     // 同义词多语言
	}>().default({}),
	
	// ========== 时间戳 ==========
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_products_cas").using("btree", table.cas.asc().nullsLast().op("text_ops")),
	index("idx_products_pubchem_cid").using("btree", table.pubchemCid.asc().nullsLast().op("int4_ops")),
	index("idx_products_hs_code").using("btree", table.hsCode.asc().nullsLast().op("text_ops")),
	index("idx_products_name_en").using("btree", table.nameEn.asc().nullsLast().op("text_ops")),
]);

export const agentLinks = pgTable("agent_links", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	agentId: uuid("agent_id"),
	linkCode: varchar("link_code", { length: 20 }).notNull(),
	customContactInfo: text("custom_contact_info"),
	clicks: integer().default(0),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.agentId],
			foreignColumns: [users.id],
			name: "agent_links_agent_id_fkey"
		}),
	unique("agent_links_link_code_key").on(table.linkCode),
]);

export const messages = pgTable("messages", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	userId: uuid("user_id"),
	type: varchar({ length: 20 }).default('inquiry').notNull(),
	folder: varchar({ length: 20 }).default('inbox').notNull(),
	title: varchar({ length: 500 }).notNull(),
	content: text().notNull(),
	senderId: uuid("sender_id"),
	senderName: varchar("sender_name", { length: 255 }),
	senderAddress: varchar("sender_address", { length: 255 }),
	recipientId: uuid("recipient_id"),
	recipientName: varchar("recipient_name", { length: 255 }),
	recipientAddress: varchar("recipient_address", { length: 255 }),
	productId: uuid("product_id"),
	productName: varchar("product_name", { length: 255 }),
	cas: varchar({ length: 100 }),
	quantity: varchar({ length: 100 }),
	status: varchar({ length: 20 }).default('pending').notNull(),
	unread: boolean().default(true),
	starred: boolean().default(false),
	deleted: boolean().default(false),
	archived: boolean().default(false),
	replyContent: text("reply_content"),
	replyFrom: varchar("reply_from", { length: 255 }),
	replyAddress: varchar("reply_address", { length: 255 }),
	replyContact: jsonb("reply_contact"),
	autoSavedAt: timestamp("auto_saved_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	readAt: timestamp("read_at", { mode: 'string' }),
	attachments: jsonb().default([]),
	translations: jsonb().default({}),
	language: varchar({ length: 10 }).default('en'),
}, (table) => [
	index("idx_messages_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamp_ops")),
	index("idx_messages_folder").using("btree", table.folder.asc().nullsLast().op("text_ops")),
	index("idx_messages_recipient").using("btree", table.recipientId.asc().nullsLast().op("uuid_ops")),
	index("idx_messages_sender").using("btree", table.senderId.asc().nullsLast().op("uuid_ops")),
	index("idx_messages_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_messages_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	index("idx_messages_unread").using("btree", table.unread.asc().nullsLast().op("bool_ops")),
	index("idx_messages_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "messages_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "messages_sender_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.recipientId],
			foreignColumns: [users.id],
			name: "messages_recipient_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [agentProducts.id],
			name: "messages_product_id_fkey"
		}).onDelete("set null"),
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
	id: serial().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: varchar({ length: 64 }).notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).notNull(),
	used: boolean().default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_password_reset_tokens_expires").using("btree", table.expiresAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_password_reset_tokens_token").using("btree", table.token.asc().nullsLast().op("text_ops")),
	index("idx_password_reset_tokens_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "password_reset_tokens_user_id_fkey"
		}).onDelete("cascade"),
	unique("password_reset_tokens_token_key").on(table.token),
]);

export const systemConfigs = pgTable("system_configs", {
	id: varchar({ length: 36 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	key: varchar({ length: 100 }).notNull(),
	value: jsonb().notNull(),
	description: text(),
	category: varchar({ length: 50 }).default('general').notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	unique("system_configs_key_key").on(table.key),
]);

export const socialContactTypes = pgTable("social_contact_types", {
	id: varchar({ length: 20 }).primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	nameEn: varchar("name_en", { length: 50 }).notNull(),
	icon: varchar({ length: 50 }),
	placeholder: varchar({ length: 50 }),
	placeholderEn: varchar("placeholder_en", { length: 50 }),
	validationRegex: varchar("validation_regex", { length: 100 }),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
});

export const contactMembers = pgTable("contact_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	contactUserId: uuid("contact_user_id").notNull(),
	contactRequestId: uuid("contact_request_id"),
	contactDetails: jsonb("contact_details").default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_contact_members_contact_user").using("btree", table.contactUserId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("idx_contact_members_unique").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.contactUserId.asc().nullsLast().op("uuid_ops")),
	index("idx_contact_members_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "contact_members_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.contactUserId],
			foreignColumns: [users.id],
			name: "contact_members_contact_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.contactRequestId],
			foreignColumns: [contactRequests.id],
			name: "contact_members_contact_request_id_fkey"
		}).onDelete("set null"),
]);

export const testTable = pgTable("test_table", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }),
});

export const userSocialContacts = pgTable("user_social_contacts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	contactTypeId: varchar("contact_type_id", { length: 20 }).notNull(),
	contactValue: varchar("contact_value", { length: 100 }).notNull(),
	isVerified: boolean("is_verified").default(false),
	isVisibleInCircle: boolean("is_visible_in_circle").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_user_social_contacts_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_social_contacts_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.contactTypeId],
			foreignColumns: [socialContactTypes.id],
			name: "user_social_contacts_contact_type_id_fkey"
		}),
	unique("user_social_contacts_user_id_contact_type_id_key").on(table.userId, table.contactTypeId),
]);

export const contactRequests = pgTable("contact_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	requesterId: uuid("requester_id").notNull(),
	receiverId: uuid("receiver_id").notNull(),
	messageId: varchar("message_id", { length: 255 }),
	requestedContactIds: jsonb("requested_contact_ids").default([]),
	requesterSharedContacts: jsonb("requester_shared_contacts").default({}),
	message: text(),
	status: varchar({ length: 50 }).default('pending').notNull(),
	rejectionReason: text("rejection_reason"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	respondedAt: timestamp("responded_at", { withTimezone: true, mode: 'string' }),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_contact_requests_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_contact_requests_receiver").using("btree", table.receiverId.asc().nullsLast().op("uuid_ops")),
	index("idx_contact_requests_requester").using("btree", table.requesterId.asc().nullsLast().op("uuid_ops")),
	index("idx_contact_requests_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.requesterId],
			foreignColumns: [users.id],
			name: "contact_requests_requester_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [users.id],
			name: "contact_requests_receiver_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [messages.id],
			name: "contact_requests_message_id_fkey"
		}).onDelete("set null"),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	type: varchar({ length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text(),
	data: jsonb().default({}),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_notifications_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_notifications_is_read").using("btree", table.isRead.asc().nullsLast().op("bool_ops")),
	index("idx_notifications_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_fkey"
		}).onDelete("cascade"),
]);

// 用户详细资料表
export const userProfiles = pgTable("user_profiles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	
	// 联系邮箱
	externalEmail: varchar("external_email", { length: 255 }),
	externalEmailVerified: boolean("external_email_verified").default(false),
	
	// 地址信息
	country: varchar({ length: 100 }),
	city: varchar({ length: 100 }),
	address: text(),
	
	// 社交通讯联系方式
	wechat: varchar({ length: 50 }),
	whatsapp: varchar({ length: 50 }),
	telegram: varchar({ length: 100 }),
	messenger: varchar({ length: 100 }),
	skype: varchar({ length: 100 }),
	qq: varchar({ length: 50 }),
	line: varchar({ length: 100 }),
	viber: varchar({ length: 100 }),
	instagram: varchar({ length: 100 }),
	linkedin: varchar({ length: 100 }),
	tiktok: varchar({ length: 100 }),
	quickEmail: varchar("quick_email", { length: 255 }),
	
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_user_profiles_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_profiles_user_id_fkey"
		}).onDelete("cascade"),
]);

// 用户邮箱账户表（用于发送外网邮件）
export const emailAccounts = pgTable("email_accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	senderName: varchar("sender_name", { length: 255 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	password: varchar({ length: 255 }), // 加密存储的密码
	smtpHost: varchar("smtp_host", { length: 255 }).notNull(),
	smtpPort: integer("smtp_port").notNull(),
	imapHost: varchar("imap_host", { length: 255 }),
	imapPort: integer("imap_port"),
	useTls: boolean("use_tls").default(true),
	isDefault: boolean("is_default").default(false),
	isActive: boolean("is_active").default(true),
	lastSyncAt: timestamp("last_sync_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_email_accounts_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	index("idx_email_accounts_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "email_accounts_user_id_fkey"
		}).onDelete("cascade"),
]);

// 代理产品表
// SKU 表 - 库存单位（规格+代理商）
export const agentProducts = pgTable("agent_products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	
	// 关联 SPU
	spuId: uuid("spu_id").references(() => products.id, { onDelete: "set null" }),
	
	// 冗余存储 CAS 便于查询（向后兼容）
	cas: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 255 }).notNull(),
	
	// 代理商信息
	agentId: uuid("agent_id").notNull(),
	
	// SKU 特有属性（规格）
	purity: varchar({ length: 50 }),
	packageSpec: varchar("package_spec", { length: 100 }),
	price: numeric({ precision: 10, scale: 2 }),
	minOrder: integer("min_order"),
	stock: integer(),
	stockPublic: boolean("stock_public").default(true),
	origin: varchar({ length: 100 }),
	remark: text(),
	
	// 多语言翻译
	translations: jsonb("translations").$type<{
		name?: Record<string, string>;
		remark?: Record<string, string>;
		origin?: Record<string, string>;
	}>().default({}),
	
	// 审核状态
	status: varchar({ length: 20 }).default('pending').notNull(),
	reviewNote: text("review_note"),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
	reviewedBy: uuid("reviewed_by"),
	
	// 产品图
	imageKey: text("image_key"),
	catalogId: uuid("catalog_id"),
	
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_agent_products_agent_id").using("btree", table.agentId.asc().nullsLast().op("uuid_ops")),
	index("idx_agent_products_spu_id").using("btree", table.spuId.asc().nullsLast().op("uuid_ops")),
	index("idx_agent_products_cas").using("btree", table.cas.asc().nullsLast().op("text_ops")),
	index("idx_agent_products_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.agentId],
			foreignColumns: [users.id],
			name: "agent_products_agent_id_fkey"
		}).onDelete("cascade"),
]);


// ============================================
// 贸易数据表 (UN Comtrade)
// ============================================

// 贸易数据主表 - 按年度存储
export const tradeData = pgTable("trade_data", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	
	// 产品标识
	cas: varchar({ length: 50 }).notNull(),
	hsCode: varchar("hs_code", { length: 10 }).notNull(),
	productName: varchar("product_name", { length: 255 }),
	productNameEn: varchar("product_name_en", { length: 255 }),
	
	// 报告国/地区
	reporterCode: varchar("reporter_code", { length: 10 }).notNull(),
	reporterName: varchar("reporter_name", { length: 100 }),
	reporterNameEn: varchar("reporter_name_en", { length: 100 }),
	
	// 贸易伙伴国/地区 (0 = 全球合计)
	partnerCode: varchar("partner_code", { length: 10 }).notNull().default('0'),
	partnerName: varchar("partner_name", { length: 100 }),
	partnerNameEn: varchar("partner_name_en", { length: 100 }),
	
	// 时间维度
	year: integer().notNull(),
	
	// 贸易流向 (X=出口, M=进口)
	flowCode: varchar("flow_code", { length: 5 }).notNull(),
	flowName: varchar("flow_name", { length: 20 }),
	
	// 贸易数值
	value: numeric({ precision: 18, scale: 2 }).notNull().default('0'), // 美元
	quantity: numeric({ precision: 18, scale: 2 }), // 数量（吨）
	unitPrice: numeric("unit_price", { precision: 10, scale: 4 }), // 单价
	
	// 数据来源
	dataSource: varchar("data_source", { length: 50 }).default('un-comtrade'),
	rawData: jsonb("raw_data"), // 原始API响应数据
	
	// 时间戳
	syncedAt: timestamp("synced_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	// 复合索引：按CAS、报告国、年份查询
	index("idx_trade_data_cas_reporter_year").using("btree", 
		table.cas.asc().nullsLast().op("text_ops"),
		table.reporterCode.asc().nullsLast().op("text_ops"),
		table.year.asc().nullsLast().op("int4_ops")
	),
	// 索引：按HS编码查询
	index("idx_trade_data_hs_code").using("btree", table.hsCode.asc().nullsLast().op("text_ops")),
	// 索引：按年份范围查询
	index("idx_trade_data_year").using("btree", table.year.asc().nullsLast().op("int4_ops")),
	// 唯一约束：同一产品、报告国、伙伴国、年份、流向只有一条记录
	unique("trade_data_unique").on(
		table.cas, 
		table.reporterCode, 
		table.partnerCode, 
		table.year, 
		table.flowCode
	),
]);

// 数据同步任务表 - 管理员触发的同步任务
export const tradeDataSyncTasks = pgTable("trade_data_sync_tasks", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	
	// 同步范围
	casList: jsonb("cas_list").$type<string[]>().notNull(), // CAS列表
	reporterCodes: jsonb("reporter_codes").$type<string[]>().notNull(), // 报告国列表
	yearRange: jsonb("year_range").$type<{ start: number; end: number }>().notNull(), // 年份范围
	
	// 任务状态
	status: varchar({ length: 20 }).default('pending').notNull(), // pending, running, completed, failed
	progress: integer().default(0), // 进度百分比
	totalItems: integer("total_items").default(0), // 总条目数
	processedItems: integer("processed_items").default(0), // 已处理条目数
	errorCount: integer("error_count").default(0), // 错误数
	errorLog: jsonb("error_log").$type<Array<{ cas: string; error: string }>>(),
	
	// 触发信息
	triggeredBy: uuid("triggered_by").notNull(), // 管理员用户ID
	triggeredAt: timestamp("triggered_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	
	// 完成信息
	startedAt: timestamp("started_at", { withTimezone: true, mode: 'string' }),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_trade_data_sync_tasks_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_trade_data_sync_tasks_triggered_by").using("btree", table.triggeredBy.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.triggeredBy],
		foreignColumns: [users.id],
		name: "trade_data_sync_tasks_triggered_by_fkey"
	}).onDelete("cascade"),
]);

// 中国海关数据表 - 月度详细贸易数据
export const customsData = pgTable("customs_data", {
	id: serial().primaryKey(),
	
	// 时间维度
	yearMonth: varchar("year_month", { length: 6 }).notNull(), // 202001
	year: integer().notNull(), // 2020
	month: integer().notNull(), // 1-12
	
	// 商品维度
	hsCode: varchar("hs_code", { length: 10 }).notNull(), // HS编码
	productName: varchar("product_name", { length: 255 }), // 商品名称
	
	// 贸易伙伴维度
	partnerCode: varchar("partner_code", { length: 10 }).notNull(), // 国家代码
	partnerName: varchar("partner_name", { length: 100 }).notNull(), // 国家名称
	
	// 贸易方式维度
	tradeModeCode: varchar("trade_mode_code", { length: 10 }).notNull(), // 贸易方式代码
	tradeModeName: varchar("trade_mode_name", { length: 50 }).notNull(), // 贸易方式名称
	
	// 注册地维度
	regionCode: varchar("region_code", { length: 10 }).notNull(), // 省份代码
	regionName: varchar("region_name", { length: 50 }).notNull(), // 省份名称
	
	// 进出口方向
	flowCode: varchar("flow_code", { length: 10 }), // 进出口标识: I=进口, E=出口
	flowName: varchar("flow_name", { length: 50 }), // 进出口名称: 进口/出口
	
	// 金额
	value: numeric("value", { precision: 15, scale: 2 }).notNull(), // 美元金额
	
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_customs_data_year_month").using("btree", table.yearMonth.asc().nullsLast().op("text_ops")),
	index("idx_customs_data_hs_code").using("btree", table.hsCode.asc().nullsLast().op("text_ops")),
	index("idx_customs_data_partner").using("btree", table.partnerCode.asc().nullsLast().op("text_ops")),
	index("idx_customs_data_region").using("btree", table.regionCode.asc().nullsLast().op("text_ops")),
]);


// ============================================
// SPU 申请表
// ============================================
export const spuRequests = pgTable("spu_requests", {
  id: serial().primaryKey(),
  cas: varchar({ length: 50 }).notNull(),
  userId: uuid("user_id").notNull(),
  userEmail: varchar("user_email", { length: 255 }),
  userName: varchar("user_name", { length: 255 }),
  reason: varchar({ length: 50 }), // purchase, supply, data_report, other
  reasonDetail: text("reason_detail"),
  status: varchar({ length: 20 }).default('pending').notNull(), // pending, approved, rejected
  rejectReason: text("reject_reason"),
  reviewedBy: uuid("reviewed_by"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
  index("idx_spu_requests_cas").using("btree", table.cas.asc().nullsLast().op("text_ops")),
  index("idx_spu_requests_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
  index("idx_spu_requests_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [users.id],
    name: "fk_spu_requests_user_id",
  }).onDelete("cascade"),
]);
