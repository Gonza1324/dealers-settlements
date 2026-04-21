drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_dealers_updated_at on public.dealers;
create trigger set_dealers_updated_at
before update on public.dealers
for each row execute function public.set_updated_at();

drop trigger if exists set_partners_updated_at on public.partners;
create trigger set_partners_updated_at
before update on public.partners
for each row execute function public.set_updated_at();

drop trigger if exists set_dealer_partner_shares_updated_at on public.dealer_partner_shares;
create trigger set_dealer_partner_shares_updated_at
before update on public.dealer_partner_shares
for each row execute function public.set_updated_at();

drop trigger if exists set_financiers_updated_at on public.financiers;
create trigger set_financiers_updated_at
before update on public.financiers
for each row execute function public.set_updated_at();

drop trigger if exists set_financier_aliases_updated_at on public.financier_aliases;
create trigger set_financier_aliases_updated_at
before update on public.financier_aliases
for each row execute function public.set_updated_at();

drop trigger if exists set_dealer_financier_assignments_updated_at on public.dealer_financier_assignments;
create trigger set_dealer_financier_assignments_updated_at
before update on public.dealer_financier_assignments
for each row execute function public.set_updated_at();

drop trigger if exists set_import_templates_updated_at on public.import_templates;
create trigger set_import_templates_updated_at
before update on public.import_templates
for each row execute function public.set_updated_at();

drop trigger if exists set_import_files_updated_at on public.import_files;
create trigger set_import_files_updated_at
before update on public.import_files
for each row execute function public.set_updated_at();

drop trigger if exists set_raw_deal_rows_updated_at on public.raw_deal_rows;
create trigger set_raw_deal_rows_updated_at
before update on public.raw_deal_rows
for each row execute function public.set_updated_at();

drop trigger if exists set_deals_updated_at on public.deals;
create trigger set_deals_updated_at
before update on public.deals
for each row execute function public.set_updated_at();

drop trigger if exists set_expense_categories_updated_at on public.expense_categories;
create trigger set_expense_categories_updated_at
before update on public.expense_categories
for each row execute function public.set_updated_at();

drop trigger if exists set_expense_recurring_templates_updated_at on public.expense_recurring_templates;
create trigger set_expense_recurring_templates_updated_at
before update on public.expense_recurring_templates
for each row execute function public.set_updated_at();

drop trigger if exists set_expenses_updated_at on public.expenses;
create trigger set_expenses_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

drop trigger if exists set_expense_allocations_updated_at on public.expense_allocations;
create trigger set_expense_allocations_updated_at
before update on public.expense_allocations
for each row execute function public.set_updated_at();

drop trigger if exists set_monthly_calculation_runs_updated_at on public.monthly_calculation_runs;
create trigger set_monthly_calculation_runs_updated_at
before update on public.monthly_calculation_runs
for each row execute function public.set_updated_at();

drop trigger if exists set_dealer_monthly_results_updated_at on public.dealer_monthly_results;
create trigger set_dealer_monthly_results_updated_at
before update on public.dealer_monthly_results
for each row execute function public.set_updated_at();

drop trigger if exists set_partner_monthly_results_updated_at on public.partner_monthly_results;
create trigger set_partner_monthly_results_updated_at
before update on public.partner_monthly_results
for each row execute function public.set_updated_at();

drop trigger if exists set_partner_monthly_payouts_updated_at on public.partner_monthly_payouts;
create trigger set_partner_monthly_payouts_updated_at
before update on public.partner_monthly_payouts
for each row execute function public.set_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
