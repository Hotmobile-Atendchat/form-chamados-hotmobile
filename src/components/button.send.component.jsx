import * as React from 'react';
import LoadingButton from '@mui/lab/LoadingButton';
import SendIcon from '@mui/icons-material/Send';
import { toast } from 'react-toastify';
import axios from 'axios';

const API_URL = 'https://form-chamados-hotmobile-production.up.railway.app';

const appendBaseFields = (dataToSend, formData) => {
  dataToSend.append('nome', formData.nome);
  dataToSend.append('descricao', formData.descricao || '');

  formData.email.forEach((email) => {
    if (email && email.trim() !== '') dataToSend.append('emails', email);
  });

  formData.telefone.forEach((telefone) => {
    if (telefone && telefone.trim() !== '') dataToSend.append('telefones', telefone);
  });

  if (formData.anexos && formData.anexos.length > 0) {
    Array.from(formData.anexos).forEach((file) => {
      dataToSend.append('files', file);
    });
  }
};

export default function LoadingButtonsTransition({ formData, setFormData }) {
  const [loading, setLoading] = React.useState(false);

  const handleClick = async () => {
    if (!formData.nome) {
      toast.warning('Por favor, preencha o nome da empresa.');
      return;
    }

    if (formData.tipoSolicitacao === 'CHAMADO' && !formData.servico) {
      toast.warning('Por favor, selecione o servi\u00e7o.');
      return;
    }

    if (formData.tipoSolicitacao === 'PROJETO' && !formData.tipoProjeto) {
      toast.warning('Por favor, selecione o tipo de projeto.');
      return;
    }

    setLoading(true);

    try {
      const dataToSend = new FormData();
      dataToSend.append('tipoSolicitacao', formData.tipoSolicitacao);
      appendBaseFields(dataToSend, formData);

      if (formData.tipoSolicitacao === 'CHAMADO') {
        dataToSend.append('servico', formData.servico);
      } else {
        dataToSend.append('tipoProjeto', formData.tipoProjeto);
      }

      const endpoint = formData.tipoSolicitacao === 'PROJETO' ? 'projetos' : 'chamados';
      try {
        await axios.post(`${API_URL}/${endpoint}`, dataToSend);
      } catch (error) {
        const projectRouteMissing =
          formData.tipoSolicitacao === 'PROJETO' && error?.response?.status === 404;

        if (!projectRouteMissing) throw error;

        const fallbackPayload = new FormData();
        appendBaseFields(fallbackPayload, formData);
        fallbackPayload.append('servico', `Projeto - ${formData.tipoProjeto}`);
        fallbackPayload.set(
          'descricao',
          `[Projeto] ${formData.tipoProjeto}\n${formData.descricao || 'Solicitação de novo projeto.'}`,
        );

        await axios.post(`${API_URL}/chamados`, fallbackPayload);
        toast.warning(
          'Projeto enviado como chamado temporariamente. Vamos normalizar assim que o backend for atualizado.',
        );
      }

      setFormData({
        tipoSolicitacao: 'CHAMADO',
        nome: '',
        email: [''],
        telefone: [''],
        servico: '',
        tipoProjeto: '',
        descricao: '',
        anexos: [],
      });

      toast.success(formData.tipoSolicitacao === 'PROJETO' ? 'Projeto aberto com sucesso!' : 'Chamado aberto com sucesso!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const mensagemErro = error.response?.data?.message || 'Erro ao enviar solicita\u00e7\u00e3o.';
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
      sx={{
        px: 4,
        py: 1.1,
        borderRadius: 2.2,
        fontWeight: 700,
        textTransform: 'none',
        minWidth: { xs: '100%', sm: 240 },
        boxShadow: '0 12px 26px rgba(25, 118, 210, 0.35)',
      }}
    >
      Enviar
    </LoadingButton>
  );
}
