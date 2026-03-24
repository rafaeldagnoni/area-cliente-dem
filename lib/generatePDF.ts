export const gerarPDF = async (nomeArquivo: string) => {
  try {
    // Pega o elemento da página
    const elemento = document.querySelector('main');
    
    if (!elemento) {
      alert('Erro: Conteúdo não encontrado');
      return;
    }

    // Importa a biblioteca dinamicamente
    const html2pdf = (await import('html2pdf.js')).default;

    // Configurações do PDF
    const opcoes = {
      margin: 10,
      filename: `${nomeArquivo}_${new Date().toLocaleDateString('pt-BR')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
    };

    // Gera o PDF
    html2pdf().set(opcoes).from(elemento).save();
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    alert('Erro ao gerar PDF');
  }
};
