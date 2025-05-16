const StepCheckingImg = "/image/step-checkin.png";
export const steps = [
  {
    step: 1,
    target: 'menu-modulos',
    title: 'Ciclos e Acompanhamentos',
    description: 'Os ciclos de planejamento organizam os indicadores em períodos definidos com início, fim e tema estratégico. Aqui você pode criar novos ciclos, revisar os existentes e acompanhar a evolução dos resultados ao longo do tempo. Use o menu lateral para navegar, editar ou acompanhar os ciclos ativos.',
    placement: 'bottom',
  },
  {
    step: 2,
    target: 'menu-perfil',
    title: 'Usuários e Times',
    description: 'Convide novos membros para sua organização, defina seus papéis como champion (facilitadores) e colaborador. Organize-os em times. Essa estrutura é essencial para acompanhar responsabilidades, alinhar prioridades por equipe e garantir que todos estejam focados nos resultados certos. Use este menu também para gerenciar as informações do seu perfil.',
    placement: 'bottom',
  },
  {
    step: 3,
    target: 'view-types',
    title: 'Visualizações',
    description: 'Escolha entre visualizar seus indicadores em formato de lista ou em gráfico. Altere conforme a sua preferência para facilitar a análise e o acompanhamento dos resultados.',
    placement: 'left',
  },
  {
    step: 4,
    target: 'okrs-view',
    title: 'Gerencie os Indicadores',
    description: 'Acompanhe e edite os objetivos da sua organização, atualize os indicadores de resultado (Key Results) e mantenha tudo alinhado com os ciclos de planejamento. Esta é a visão central da sua gestão e atualização dos resultados.',
    placement: 'left',
  },
  {
    step: 5,
    target: 'okrs-times',
    title: 'Atribua Times',
    description: 'Use essa opção para associar os times aos Indicadores de Resultado. Essa conexão ajuda a entender quem está por trás de cada entrega e permite acompanhar o progresso por equipe.',
    placement: 'right',
  }, {
    step: 6,
    target: 'confianca-button',
    title: 'Marque a Confiança',
    description: 'Antes de realizar o checkin, certifique-se de que você e seu time classificaram o quão confiantes estão sobre o alcançe dos resultados alvo dentro do ciclo. Verde - Alta Confiança, Amarelo - Média Confiança e Vermelho - Baixa Confiança.',
    placement: 'left',
  },
  {
    step: 7,
    target: 'checkin-button',
    title: 'Realize Checkins',
      description: (
        <div className="space-y-2">
          <img
            src={StepCheckingImg}
            alt="Exemplo de check-in"
            className="w-full rounded-md shadow"
             onLoad={() => {
                // força recalcular a posição após carregar imagem
                setTimeout(() => {
                  window.dispatchEvent(new Event('resize'));
                }, 50);
              }}
          />
          <p className="text-xs">
            Os check-ins são registros periódicos de progresso e confiança em relação aos indicadores.
            Ao definir datas no ciclo, você habilita o time a acompanhar a evolução real e ajustar o foco quando necessário.
            Use esse botão para registrar seu check-in.
          </p>
        </div>
      ),
      placement: 'top',
    }
];