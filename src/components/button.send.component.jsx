import * as React from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import SendIcon from '@mui/icons-material/Send';
import { toast } from 'react-toastify';
import axios from 'axios'; // Certifique-se de ter instalado: npm install axios

export default function LoadingButtonsTransition({ formData, setFormData }) {
  const [loading, setLoading] = React.useState(false);

const API_URL =  'https://form-chamados-hotmobile-production.up.railway.app';

 const handleClick = async () => {
    // 1. Validação
    if (!formData.nome) {
      toast.warning('Por favor, preencha o nome da empresa.');
      return;
    }

    if (formData.tipoSolicitacao === 'CHAMADO' && !formData.servico) {
      toast.warning('Por favor, selecione o serviço.');
      return;
    }

    if (formData.tipoSolicitacao === 'PROJETO' && !formData.tipoProjeto) {
      toast.warning('Por favor, selecione o tipo de projeto.');
      return;
    }

    setLoading(true);

    try {
      const dataToSend = new FormData();

      dataToSend.append('nome', formData.nome);
      dataToSend.append('tipoSolicitacao', formData.tipoSolicitacao);

      if (formData.tipoSolicitacao === 'CHAMADO') {
        dataToSend.append('servico', formData.servico);
      } else {
        dataToSend.append('tipoProjeto', formData.tipoProjeto);
      }

      dataToSend.append('descricao', formData.descricao);

      formData.email.forEach(email => {
        if (email && email.trim() !== '') dataToSend.append('emails', email);
      });

      formData.telefone.forEach(tel => {
        if (tel && tel.trim() !== '') dataToSend.append('telefones', tel);
      });
      
      if (formData.anexos && formData.anexos.length > 0) {
        Array.from(formData.anexos).forEach((file) => {
          dataToSend.append('files', file);
        });
      }

      console.log('Enviando para o Backend...');

      const endpoint = formData.tipoSolicitacao === 'PROJETO' ? 'projetos' : 'chamados';
      const response = await axios.post(`${API_URL}/${endpoint}`, dataToSend);

      console.log('Sucesso:', response.data);

      setFormData({
        tipoSolicitacao: 'CHAMADO',
        nome: '',
        email: [''],
        telefone: [''],
        servico: '',
        tipoProjeto: '',
        descricao: '',
        anexos: null, 
      });

      toast.success(formData.tipoSolicitacao === 'PROJETO' ? 'Projeto aberto com sucesso!' : 'Chamado aberto com sucesso!');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('Erro:', error);
      const mensagemErro = error.response?.data?.message || 'Erro ao enviar chamado.';
      
      if (Array.isArray(mensagemErro)) {
        toast.error(mensagemErro.join(', '));
      } else {
        toast.error(mensagemErro);
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <LoadingButton
      onClick={handleClick}
      endIcon={<SendIcon />}
      loading={loading}
      loadingPosition="end"
      variant="contained"
    >
      Enviar
    </LoadingButton>
  );
}
