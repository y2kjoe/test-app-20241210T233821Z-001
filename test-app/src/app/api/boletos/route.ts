import { NextResponse } from "next/server";

interface Boleto {
    cod_boleto: number;
    linha_digitavel: string;
    valor_boleto: number;
    referencia: string;
    dt_vencimento: string;
    dt_pagamento: string;
    situacao_boleto: string;
    url_boleto: string;
    pix: string;
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const cpf_associado = searchParams.get("cpf");
    const placa = searchParams.get("placa");

    if (!cpf_associado || !placa) {
        return NextResponse.json(
            { error: "Parâmetros cpf e placa são obrigatórios." },
            { status: 400 }
        );
    }

    try {
        const token = process.env.NEXT_PUBLIC_API_TOKEN;
        const apiResponse = await fetch(`https://api-integracao.ileva.com.br/boleto/lista-associado-veiculo?inicio_paginacao=0&quantidade_por_pagina=2&cpf_associado=${cpf_associado}&situacao_boleto=Aberto`, {
            method: 'GET',
            headers: {
                "Content-Type" : 'application/json',
                "access_token": `${token}`
            }
        });

        if (!apiResponse.ok) {
            const errorData = await apiResponse.json();
            return NextResponse.json(
                { error: errorData?.message || "Erro ao consultar boletos." },
                { status: apiResponse.status }
            );
        }

        const boletos = await apiResponse.json();
        return NextResponse.json(boletos);
    } catch (e) {
        return NextResponse.json(
            { error: "Erro interno ao consultar." },
            { status: 500 }
        );
    }
}