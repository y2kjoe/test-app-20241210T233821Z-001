import { NextResponse } from "next/server";

interface Veiculo {
    placa: string;
    modelo: string;
    cod_veiculo: number;
    situacao: string;
    situacao_tipo: string;
    cod_situacao: number;
}

interface Associado {
    cpf: string;
    dt_nascimento: string;
    veiculos: Veiculo[];
}

interface ApiResponse {
    associado?: Associado;
}

const situacoes = {
    ativo: 1,
    inadimplente: 2,
    inadimplente30: 5,
    verificar: 7,
    inativo_migrado: 10,
};
  
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const cpf = searchParams.get('cpf_cnpj');
  
    if (!cpf) {
      return NextResponse.json(
        {
          placas: [],
          error: 'CPF é obrigatório!',
        },
        { status: 400 }
      );
    }
  
    try {
      const token = process.env.NEXT_PUBLIC_API_TOKEN;
      const apiResponse = await fetch(`https://api-integracao.ileva.com.br/associado/buscar?cpf_cnpj=${cpf}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': `${token}`,
        },
      });
  
      if (!apiResponse.ok) throw new Error('Erro ao consultar a API.');
  
      const data: ApiResponse = await apiResponse.json();
      const associado = data.associado;
  
      if (!associado) {
        return NextResponse.json(
          { placas: [], error: 'Associado não encontrado.' },
          { status: 404 }
        );
      }
  
      if (associado.cpf !== cpf) {
        return NextResponse.json(
          { placas: [], error: 'CPF inválido.' },
          { status: 400 }
        );
      }
  
      // Filtrando veículos com base nos códigos de situação
      const veiculosValidos =
        associado.veiculos?.filter((veiculo) =>
          [situacoes.ativo, situacoes.inadimplente, situacoes.inadimplente30, situacoes.inativo_migrado, situacoes.verificar].includes(
            veiculo.cod_situacao
          )
        ) || [];
  
      // Mapeando as placas dos veículos válidos
      const placas = veiculosValidos.map((veiculo) => veiculo.placa);
  
      return NextResponse.json({ placas });
    } catch (e: any) {
      return NextResponse.json({ placas: [], error: e.message }, { status: 500 });
    }
}
  