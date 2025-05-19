import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import csv from 'csv-parser';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const inputFilePath = './users_rows.csv';
const results = [];

fs.createReadStream(inputFilePath)
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', async () => {
    for (const user of results) {
      try {
        const email = user.email?.trim();
        const user_id = user.user_id?.trim(); // ← PRESERVA O ID ORIGINAL
        const first_name = user.first_name?.trim() || '';
        const last_name = user.last_name?.trim() || '';
        const organization_id = user.organization_id?.trim() || null;

        // 1. Cria o usuário no auth com o ID original
        const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
          email,
          email_confirm: true,
          user_metadata: {},
          id: user_id, // ← ESSA LINHA É FUNDAMENTAL
        });

        if (createError) throw createError;

        // 2. Insere na tabela users com o mesmo user_id
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            user_id,
            email,
            first_name,
            last_name,
            organization_id,
          });

        if (insertError) throw insertError;

        console.log(`✅ ${email} inserido com user_id ${user_id}`);
      } catch (err) {
        console.error(`❌ Erro com ${user?.email || 'usuário desconhecido'}:`, err.message || err);
      }
    }

    console.log('\n🏁 Processo finalizado com sucesso!');
  });
