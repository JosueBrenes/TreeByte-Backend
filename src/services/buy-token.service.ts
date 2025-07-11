// src/services/buy-token.service.ts
import supabase from '@/lib/db/db';
import { simulateSorobanBuyCall } from '@/lib/soroban/soroban-client';

type BuyTokenParams = {
  project_id: number;
  user_id: number;
  amount: number;
};

export const handleBuyToken = async ({ project_id, user_id, amount }: BuyTokenParams) => {

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', project_id)
    .single();

  if (projectError || !project) {
    throw new Error('Project not found');
  }


  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user_id)
    .single();

  if (userError || !user) {
    throw new Error('User not found');
  }

  const hasTrustline = true; 
  if (!hasTrustline) {
    throw new Error('User does not have a trustline for this asset.');
  }


  const txConfirmation = await simulateSorobanBuyCall({
    buyerAddress: user.wallet_address,
    projectAsset: project.asset_code,
    amount,
  });


  const { data: purchase, error: purchaseError } = await supabase
    .from('purchases')
    .insert([
      {
        user_id,
        project_id,
        amount,
        purchase_date: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (purchaseError) {
    console.error(purchaseError);
    throw new Error('Failed to record purchase');
  }

  return {
    message: 'Token purchase successful',
    transaction: txConfirmation,
    purchase,
  };
};
