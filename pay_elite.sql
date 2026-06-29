DO $$
DECLARE
  v_org_id UUID := '8d2cecf1-e6c3-491d-a434-9e50ee914192';
  c RECORD;
  v_payment_id UUID;
  v_total_amount DECIMAL := 0;
BEGIN
  FOR c IN 
    SELECT id, member_profile_id, contribution_plan_id, amount_due 
    FROM contributions 
    WHERE organization_id = v_org_id AND status = 'due'
  LOOP
    -- Create payment
    v_payment_id := gen_random_uuid();
    INSERT INTO payments (id, organization_id, member_profile_id, contribution_plan_id, amount, status, provider, paid_at, created_at, updated_at)
    VALUES (v_payment_id, v_org_id, c.member_profile_id, c.contribution_plan_id, c.amount_due, 'completed', 'cash', NOW(), NOW(), NOW());
    
    -- Update contribution
    UPDATE contributions 
    SET amount_paid = c.amount_due, status = 'paid', updated_at = NOW()
    WHERE id = c.id;
    
    v_total_amount := v_total_amount + c.amount_due;
  END LOOP;

  -- Add cash transaction
  IF v_total_amount > 0 THEN
    INSERT INTO cash_transactions (organization_id, direction, amount, category, description, status, occurred_at)
    VALUES (v_org_id, 'in', v_total_amount, 'contribution', 'Paiement en bloc des cotisations de Juin (Elite)', 'posted', NOW());
  END IF;
END $$;
