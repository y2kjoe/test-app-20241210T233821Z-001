'use client';

import { useState } from "react";
import { FaCopy } from "react-icons/fa";
import { FaFilePdf } from "react-icons/fa6";

// estrutura api de placas (lista de placas e erro)
interface PlacasResponse {
  placas: string[];
  error?: string;
}

// estrutura api de boleto
interface Boleto {
  cod_boleto: string;
  linha_digitavel: string;
  url_boleto: string;
  pix: string;
  situacao_boleto: string;
  dt_vencimento: string; // Data de vencimento em formato string
}

export default function Home() {
  // armazenar cpf/cpnj digitado
  const [cpf_cnpj, setCpf] = useState<string>('');
  // armazenar a lista de placas retornadas pela api
  const [placas, setPlacas] = useState<string[]>([]);
  // armazenar o(s) boleto(s) encontrado (inicialmente ele é vazio)
  const [boletos, setBoletos] = useState<Boleto | null>(null);
  // armazenar as mensagens de erro
  const [error, setError] = useState<string>('');

  // convertendo as datas no formato brasileiro 'DD/MM/YYYY'
  const formatarData = (data: string): string => {
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
  };

  const consultarBoletos = async () => {
    // vai limpar todos os estados antes de consultar outro boleto
    setError('');
    setPlacas([]);
    setBoletos(null);

    try {
      // faz a requisição para buscar as placas relacionadas ao cpf
      const placasRes = await fetch(`/api/placas?cpf_cnpj=${cpf_cnpj}`);
      // convertendo a resposta da api para o formato esperado (json)
      const placasData: PlacasResponse = await placasRes.json();

      // se a api da ileva der algum erro ele vai retornar aqui alguma mensagem de erro
      if (placasData.error) {
        setError(placasData.error);
        return;
      }

      // verificar se não há placas ativas, se não existir, exibir uma mensagem de erro
      const placasAtivas = placasData.placas || [];
      if (placasAtivas.length === 0) {
        setError('Nenhuma placa encontrada para o CPF informado.');
        return;
      }

      // atualiza o estado com a lista das placas encontradas
      setPlacas(placasAtivas);

      // faz a requisição para buscar os boletos relacionados às placas
      const boletosRes = await fetch(`/api/boletos?cpf=${cpf_cnpj}&placa=${placasAtivas.join(',')}`);
      const boletosData = await boletosRes.json();

      // verificar possiveis erros ou se não existe boleto em aberto
      if (!boletosData || boletosData.error || !boletosData.boletos || boletosData.boletos.length === 0) {
        setError('Nenhum boleto em aberto foi encontrado para as placas do CPF informado!');
        return;
      }

      // buscar somente pela situacao que estiver aberto
      const boletoAberto = boletosData.boletos.find(
        (boleto: Boleto) => boleto.situacao_boleto === 'Aberto'
      );

      // se nao encontrar boletos em aberto vai retornar um erro
      if (!boletoAberto) {
        setError('Nenhum boleto em aberto foi encontrado para as placas do CPF informado!');
        return;
      }

      // atualiza o estado com o boleto encontrado
      setBoletos(boletoAberto);
    } catch (error) {
      setError('Erro ao consultar boletos.');
    }
  };

  // copiar a linha digitavel
  const copiarCodigoDeBarras = (linhaDigitavel: string) => {
    navigator.clipboard.writeText(linhaDigitavel)
      .then(() => alert('Código de barras copiado!'))
      .catch(() => alert('Erro ao copiar código de barras.'));
  };

  // copiar o pix
  const copiarPixCola = (pix: string) => {
    navigator.clipboard.writeText(pix)
      .then(() => alert('PIX Copiado!'))
      .catch(() => alert('Erro ao copiar pix.'));
  };

  return (
    <div style={{ padding: `20px` }}>
      <h1>Consulta de Boletos</h1>
      <input
        type="text"
        placeholder="Digite o CPF"
        value={cpf_cnpj}
        onChange={(e) => setCpf(e.target.value)}
        style={{ padding: `5px`, marginRight: `10px` }}
      />
      <button onClick={consultarBoletos} style={{ padding: `5px 10px` }}>
        Consultar Boletos
      </button>
      {error && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          {error.split('\n').map((err, idx) => (
            <p key={idx}>{err}</p>
          ))}
        </div>
      )}

      {placas.length > 0 && boletos && (
        <table border={"1"} style={{ marginTop: '20px', width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Veículos</th>
              <th>Data de Vencimento</th>
              <th>Linha Digitável</th>
              <th>PDF</th>
              <th>Pix</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {placas.slice(0, 5).join(', ')}
                {placas.length > 5 && '...'}
                {/*exibindo até 5 placas, se ultrapassar o limite ele vai mostrar os tres pontinhos indicando que tem mais placas*/}
              </td>
              <td>{formatarData(boletos.dt_vencimento)}</td>
              <td>
                {boletos.linha_digitavel}
                <button onClick={() => copiarCodigoDeBarras(boletos.linha_digitavel)}>
                  <FaCopy />
                </button>
              </td>
              <td>
                <button onClick={() => window.open(boletos.url_boleto, '_blank')}>
                  Abrir PDF <FaFilePdf />
                </button>
              </td>
              <td>
                {boletos.pix}
                <button onClick={() => copiarPixCola(boletos.pix)}>
                  <FaCopy />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
