export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

// Simplified shipping calculation based on Brazilian regions
// Since Correios public API is discontinued (requires contract), we use a distance-based estimation
const ORIGIN_CEP = '01001000'; // São Paulo default origin

const stateFromCep: Record<string, string> = {
  '01': 'SP', '02': 'SP', '03': 'SP', '04': 'SP', '05': 'SP', '06': 'SP', '07': 'SP', '08': 'SP', '09': 'SP',
  '10': 'SP', '11': 'SP', '12': 'SP', '13': 'SP', '14': 'SP', '15': 'SP', '16': 'SP', '17': 'SP', '18': 'SP', '19': 'SP',
  '20': 'RJ', '21': 'RJ', '22': 'RJ', '23': 'RJ', '24': 'RJ', '25': 'RJ', '26': 'RJ', '27': 'RJ', '28': 'RJ',
  '29': 'ES',
  '30': 'MG', '31': 'MG', '32': 'MG', '33': 'MG', '34': 'MG', '35': 'MG', '36': 'MG', '37': 'MG', '38': 'MG', '39': 'MG',
  '40': 'BA', '41': 'BA', '42': 'BA', '43': 'BA', '44': 'BA', '45': 'BA', '46': 'BA', '47': 'BA', '48': 'BA',
  '49': 'SE',
  '50': 'PE', '51': 'PE', '52': 'PE', '53': 'PE', '54': 'PE', '55': 'PE', '56': 'PE',
  '57': 'AL',
  '58': 'PB',
  '59': 'RN',
  '60': 'CE', '61': 'CE', '62': 'CE', '63': 'CE',
  '64': 'PI',
  '65': 'MA',
  '66': 'PA', '67': 'PA', '68': 'PA',
  '69': 'AM',
  '70': 'DF', '71': 'DF', '72': 'GO', '73': 'GO', '74': 'GO', '75': 'GO', '76': 'GO',
  '77': 'TO',
  '78': 'MT',
  '79': 'MS',
  '80': 'PR', '81': 'PR', '82': 'PR', '83': 'PR', '84': 'PR', '85': 'PR', '86': 'PR', '87': 'PR',
  '88': 'SC', '89': 'SC',
  '90': 'RS', '91': 'RS', '92': 'RS', '93': 'RS', '94': 'RS', '95': 'RS', '96': 'RS', '97': 'RS', '98': 'RS', '99': 'RS',
};

type Region = 'local' | 'sudeste' | 'sul' | 'centro_oeste' | 'nordeste' | 'norte';

function getRegion(cep: string): Region {
  const prefix = cep?.slice(0, 2) ?? '';
  const state = stateFromCep[prefix] ?? '';
  if (state === 'SP') return 'local';
  if (['RJ', 'MG', 'ES'].includes(state)) return 'sudeste';
  if (['PR', 'SC', 'RS'].includes(state)) return 'sul';
  if (['DF', 'GO', 'MT', 'MS', 'TO'].includes(state)) return 'centro_oeste';
  if (['BA', 'SE', 'PE', 'AL', 'PB', 'RN', 'CE', 'PI', 'MA'].includes(state)) return 'nordeste';
  return 'norte';
}

const basePrices: Record<Region, { pac: number; sedex: number; pacDays: string; sedexDays: string }> = {
  local: { pac: 15.90, sedex: 22.50, pacDays: '3 a 5 dias úteis', sedexDays: '1 a 2 dias úteis' },
  sudeste: { pac: 19.90, sedex: 29.90, pacDays: '4 a 7 dias úteis', sedexDays: '2 a 3 dias úteis' },
  sul: { pac: 23.90, sedex: 35.90, pacDays: '5 a 8 dias úteis', sedexDays: '2 a 4 dias úteis' },
  centro_oeste: { pac: 25.90, sedex: 39.90, pacDays: '6 a 10 dias úteis', sedexDays: '3 a 5 dias úteis' },
  nordeste: { pac: 29.90, sedex: 45.90, pacDays: '8 a 12 dias úteis', sedexDays: '4 a 6 dias úteis' },
  norte: { pac: 35.90, sedex: 55.90, pacDays: '10 a 15 dias úteis', sedexDays: '5 a 8 dias úteis' },
};

export async function POST(request: Request) {
  try {
    const { cep, weight } = await request.json();
    const cleanCep = (cep ?? '').replace(/\D/g, '');
    if (cleanCep?.length !== 8) {
      return NextResponse.json({ error: 'CEP inválido' }, { status: 400 });
    }

    const region = getRegion(cleanCep);
    const prices = basePrices[region];
    
    // Weight factor (base is 300g, add per additional 500g)
    const weightKg = (weight ?? 300) / 1000;
    const weightFactor = Math.max(1, Math.ceil(weightKg / 0.5));
    const extraWeight = (weightFactor - 1) * 3;

    const options = [
      {
        name: 'PAC',
        price: ((prices?.pac ?? 15.90) + extraWeight).toFixed(2),
        deadline: prices?.pacDays ?? '5 a 10 dias úteis',
      },
      {
        name: 'SEDEX',
        price: ((prices?.sedex ?? 22.50) + extraWeight).toFixed(2),
        deadline: prices?.sedexDays ?? '2 a 5 dias úteis',
      },
    ];

    return NextResponse.json({ options });
  } catch (error: any) {
    console.error('Shipping error:', error);
    return NextResponse.json({ error: 'Erro ao calcular frete' }, { status: 500 });
  }
}
