CREATE TABLE "actions" (
	"id" text PRIMARY KEY NOT NULL,
	"market_id" text NOT NULL,
	"actor_id" text NOT NULL,
	"mode" text NOT NULL,
	"action_type" text NOT NULL,
	"side" text,
	"intended_price" numeric,
	"intended_size" numeric,
	"observed_price" numeric,
	"observed_size" numeric,
	"tx_hash" text,
	"block_number" integer,
	"decision_reason" text,
	"snapshot_hash" text,
	"receipt_hash" text,
	"raw" jsonb,
	"occurred_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "actors" (
	"id" text PRIMARY KEY NOT NULL,
	"address" text,
	"display_name" text,
	"type" text DEFAULT 'unknown' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"id" text PRIMARY KEY NOT NULL,
	"symbol" text NOT NULL,
	"pool_address" text,
	"base_asset" text,
	"quote_asset" text,
	"status" text DEFAULT 'unknown' NOT NULL,
	"starts_at" timestamp with time zone,
	"ends_at" timestamp with time zone,
	"settled_at" timestamp with time zone,
	"outcome" text,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"action_id" text NOT NULL,
	"market_active" boolean NOT NULL,
	"time_left_ok" boolean NOT NULL,
	"liquidity_ok" boolean NOT NULL,
	"spread_ok" boolean NOT NULL,
	"slippage_ok" boolean NOT NULL,
	"size_ok" boolean NOT NULL,
	"budget_ok" boolean NOT NULL,
	"result" text NOT NULL,
	"reasons" jsonb NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scores" (
	"id" text PRIMARY KEY NOT NULL,
	"action_id" text NOT NULL,
	"actor_id" text NOT NULL,
	"market_id" text NOT NULL,
	"correct" boolean,
	"pnl" numeric,
	"brier_score" numeric,
	"fill_quality" text,
	"risk_adjusted_score" numeric,
	"notes" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" text PRIMARY KEY NOT NULL,
	"market_id" text NOT NULL,
	"outcome" text NOT NULL,
	"settled_at" timestamp with time zone NOT NULL,
	"tx_hash" text,
	"raw" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_actor_id_actors_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_checks" ADD CONSTRAINT "risk_checks_action_id_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."actions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_action_id_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."actions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_actor_id_actors_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."actors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "actions_market_idx" ON "actions" USING btree ("market_id");--> statement-breakpoint
CREATE INDEX "actions_actor_idx" ON "actions" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "actions_tx_idx" ON "actions" USING btree ("tx_hash");