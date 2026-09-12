CREATE INDEX "journal_entries_entry_date_idx" ON "journal_entries" USING btree ("entry_date");--> statement-breakpoint
CREATE INDEX "fee_payments_payment_date_idx" ON "fee_payments" USING btree ("payment_date");--> statement-breakpoint
CREATE INDEX "attendance_records_attendance_date_idx" ON "attendance_records" USING btree ("attendance_date");