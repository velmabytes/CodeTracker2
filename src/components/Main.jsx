import React, { useState, useRef, useEffect } from 'react';
// import Modal from 'react-modal';
import { InputWithLimit } from './InputWithLimit';
import CodeTable from './CodeTable';
import '../css/main.css';
import { fetchAPI, endpointFullData, endpointCheck } from '../helpers/fetchAPI';

export default function Main() {
  // Estado de inputs ---> juntar todos em um obj mais tarde
  const [source, setSource] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [destiny, setDestiny] = useState('BR');
  const [amount, setAmount] = useState('');

  // Estado dos códigos gerados
  const [codes, setCodes] = useState(null);
  const [allValidCodes, setAllValidCodes] = useState([]);
  const [validCodes, setValidCodes] = useState([]);
  const [codesDayOne, setCodesDayOne] = useState([]);
  // const [tableCodes, setTableCodes] = useState([]);

  // Estado para serviços
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [Checking, setChecking] = useState(false);
  const codeTableRef = useRef(null);


  // Estado do modal
/*   const [modalIsOpen, setModalIsOpen] = useState(false);
  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false); */


  const getCodes = async () => {
    setError(false);
    setLoading(true);
    const codeList = [];
    const limitNumber = parseInt(amount, 10);
    if (!isNaN(limitNumber)) {
      for (let i = 0; i < limitNumber; i += 1) {
        let newTrackingCode = Number(trackingCode) + i;
        let formatedTrackingCode = String(newTrackingCode).padStart(9, '0');
        codeList.push(
          `${source.toUpperCase()}${String(
            formatedTrackingCode
          )}${destiny.toUpperCase()}`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setCodes(codeList);
    }
  };

  const isFilled = () => {
    const minCodeLength = 9;
    return !(
      (source.length === 2 || source.length === 4) &&
      trackingCode.length === minCodeLength &&
      destiny.length === 2 &&
      amount > 0
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      const listValidCodes = [];
      const listCodesDayOne = [];
      if (codes) {
        setLoading(true);

        // Divide os códigos em grupos de 100
        const codeGroups = [];
        const batchSize = 100;
        for (let i = 0; i < codes.length; i += batchSize) {
          codeGroups.push(codes.slice(i, i + batchSize));
        }

        // Envia as requisições em paralelo usando Promise.all()
        await Promise.all(
          codeGroups.map(async (codeGroup) => {
            let URL = endpointCheck;

            // Monta a URL para o grupo de códigos
            codeGroup.forEach((code, index) => {
              if (index === 0) {
                return (URL += `${code}`);
              }
              URL += `&mailNos=${code}`;
            });

            // Faz a requisição para a API
            const responses = await fetchAPI(URL);

            // Processa as respostas
            responses.module?.forEach(({ mailNo, source }) => {
              if (source && (source === 'AE')) {
                console.log(mailNo, source);
                listValidCodes.push(mailNo);
              }

              // Error
              if (responses.data?.ret) {
                if (responses.data.ret[0] === 'FAIL_SYS_USER_VALIDATE') {
                  setLoading(false);
                  setError(true);
                  return;
                }
              }
            });
            console.log(responses);
          })
        );

        // Atualiza o estado
        const sortedCodes = [...listValidCodes]
          .sort((a, b) => b.localeCompare(a))
          .slice(0, 100);

        setAllValidCodes(listValidCodes);
        setValidCodes(sortedCodes);

        // -----------------------------------
        setChecking(true);
        let url = endpointFullData;
        sortedCodes.forEach((code, index) => {
          if (index === 0) {
            return (url += `${code}`);
          }
          url += `&mailNos=${code}`;
        });

        const res = await fetchAPI(url);
        // setTableCodes([]);
        res.module?.forEach(({ mailNo, daysNumber = 'Ainda em separação', status }, index) => {
          console.log(`${mailNo} Status: ${status} Dias: ${daysNumber}`);
/*           let code = [{
            mailNo,
            status,
            daysNumber,
          }];
          setTableCodes((tableCodes) => [...tableCodes, ...code]); */
          if (daysNumber === '1	day(s)' & status === 'DELIVERING') {
            listCodesDayOne.push(mailNo);
          }
        });
        // setTableCodes(tableCodes.sort((a, b) => b.mailNo.localeCompare(a.mailNo)));
        setCodesDayOne(listCodesDayOne);
        // -----------------------------------
        console.log('Todos códigos ALIEXPRESS encontrados na busca:', listValidCodes);
        console.log('Lista com os 100 códigos mais recentes da lista acima:', sortedCodes);
        console.log('Códigos com status de 1 dia da lista acima', listCodesDayOne);
        setChecking(false);
        setLoading(false);
      }
    };

    fetchData();
  }, [codes]);

  return (
    <main className="main__container">
      <header>
        <section className="input__container">
          <h1 className='title__'>CODE TRACKER</h1>

          <form>
            <div className="input__row">
              <label htmlFor="source">
                Origem
                <InputWithLimit
                  type={'text'}
                  placeholder={'ex: NM'}
                  value={source.toUpperCase()}
                  setValue={setSource}
                  limit={4}
                  id="source"
                />
              </label>
            </div>

            <div className="input__row">
              <label htmlFor="trackingCode">
                Rastreio
                <InputWithLimit
                  type={'number'}
                  placeholder={'ex: 038255611'}
                  value={trackingCode}
                  setValue={setTrackingCode}
                  limit={9}
                  id="trackingCode"
                />
              </label>
            </div>

            <div className="input__row">
              <label htmlFor="destiny">
                Destino
                <InputWithLimit
                  type={'text'}
                  placeholder={'ex: BR'}
                  value={destiny.toUpperCase()}
                  setValue={setDestiny}
                  limit={2}
                  id="destiny"
                />
              </label>
            </div>

            <div className="input__row">
              <label htmlFor="amount">
                Quantidade
                <InputWithLimit
                  type={'number'}
                  placeholder={'ex: 50000'}
                  value={amount}
                  setValue={setAmount}
                  limit={5}
                  id="amount"
                />
              </label>
            </div>
            <button
              className="get__codes"
              disabled={isFilled()}
              type="button"
              onClick={getCodes}
            >
              Rastrear
            </button>
          </form>
        </section>

      </header>

      {/* Modal */}
{/*       <button className='btn_modal' onClick={openModal}>Informações da Consulta</button>

      <div>
        <Modal className='modal__container' isOpen={modalIsOpen}>
          <h2>Informações</h2>
          <button className='btn_modal' onClick={closeModal}>Fechar</button>
          <div>
            <table>
              <tr>
                <th>Código</th>
                <th>Status</th>
                <th>Dias</th>
              </tr>
              {tableCodes.map(({ mailNo, status, daysNumber }) => (
                <tr key={mailNo}>
                  <td>{mailNo}</td>
                  <td>{status}</td>
                  <td>{daysNumber}</td>
                </tr>
              ))}
            </table>
          </div>
        </Modal>
      </div> */}

      {error && (
        <h2>
          Tomamos timeout da API<br></br>Tente novamente mais tarde!
        </h2>
      )}

      {isLoading ? <h2>...Carregando</h2> : null}
      {Checking ? <span>Verificando códigos com status de 1 dia ...Aguarde</span> : null}

      <div className="codes__container">
        <CodeTable
          title={`Códigos Aliexpress`}
          length={allValidCodes.length}
          codes={allValidCodes}
          ref={codeTableRef}
          className="all-valid-codes-table"
        />

        <CodeTable
          title={`Códigos Aliexpress Mais Recentes`}
          length={validCodes.length}
          codes={validCodes}
          ref={codeTableRef}
          className="valid-codes-table"
        />

        <CodeTable
          title={`Códigos de 1 Dia`}
          length={codesDayOne.length}
          codes={codesDayOne}
          ref={codeTableRef}
          className="dayOne-codes-table"
        />
      </div>
    </main>
  );
}