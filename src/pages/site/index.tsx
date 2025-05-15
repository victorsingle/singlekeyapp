import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Target,
  Brain,
  Clock,
  LineChart,
  Users,
  Sparkles,
  CheckCircle,
  MessageSquareText,
  Goal,
  Gauge,
} from 'lucide-react';
import { useInView } from 'react-intersection-observer';

export function LandingPage() {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const [benefitsRef, benefitsInView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      {/* Hero Section */}
      <section className="relative px-6 py-20 sm:py-36 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-200">
        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            transition={{ duration: 0.8 }}
          >
            
            <Target className="w-16 text-blue-600 h-16 mx-auto" />
            <h1 className="text-5xl !text-black font-bold py-2 mb-10 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              SingleKey <sup class="text-xs text-gray-400">Beta</sup>
            </h1>
            <h2 className="text-4xl font-bold bg-clip-text py-3 text-transparent bg-gradient-to-r from-blue-600 to-indigo-900 tracking-tighter">
              Chega de metas soltas e ideias vagas
            </h2>
            <p className="text-lg text-gray-700 mb-10 leading-relaxed tracking-tight">
             Com a KAI, sua agente IA, você alinha seu time e cria indicadores com clareza e foco.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
             <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to="/register"
                target="_blank"
                className="w-full sm:w-auto sm:max-w-max inline-flex items-center justify-center sm:justify-start px-8 py-4 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Target className="w-5 h-5 mr-2" />
                Criar conta gratuita
              </Link>
            </motion.div>

            <motion.div>
              <Link 
                to="/login"
                target="_blank"
                className="w-full sm:w-auto sm:max-w-max inline-flex items-center justify-center sm:justify-start ml-0 sm:ml-4 px-8 py-4 bg-white text-blue-600 rounded-full font-medium hover:bg-blue-200 hover:text-blue-900 transition-all shadow-lg hover:shadow-xl"
              >
                Já tenho uma conta
              </Link>
            </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl font-bold tracking-tight">Trabalhar sem direção custa caro</h2>
            <div className="max-w-2xl text-gray-600 text-base text-sm py-2 mx-auto text-center">
              <p>
                Com poucos cliques, o SingleKey te ajuda a organizar metas, indicadores e dar direção real ao time.
              </p>
            </div>
            
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 py-4">
            {[{
              icon: <MessageSquareText className="w-20 h-20 text-blue-600" />,
              title: 'Contexto em Objetivos',
              description: 'Descreva a necessidade e contexto e a KAI gera os indicadores para seu time.'
            }, {
              icon: <Goal className="w-20 h-20 text-blue-600" />,
              title: 'Metas Inteligentes',
              description: 'Métricas claras, acionáveis e ciclos com controles e fácil inspeção.'
            }, {
              icon: <Gauge className="w-20 h-20 text-blue-600" />,
              title: 'Acompanhamento Fluido',
              description: 'Dashboard, evolução e histórico em uma interface leve e fácil de usar.'
            }].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-semibold mb-4 text-center">{item.title}</h3>
                <p className="text-gray-600 text-sm text-center">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Seção com mockups em destaque */}
      <section className="relative bg-gradient-to-b from-white via-blue-50 to-indigo-50 py-24 px-6 text-center">
        <div className="relative z-10 max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl font-bold mb-4 tracking-tight"
          >
            SingleKey em ação
          </motion.h2>
          <p className="text-gray-600 text-base text-sm mb-8">
            Mesmo com bons produtos, serviços de qualidade e uma equipe comprometida, sua empresa pode se perder sem metas claras, acompanhamento consistente e organização. O esforço existe, mas sem direção, os resultados não aparecem.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/register"
              target='_blank'
              className="inline-flex items-center px-8 py-4 bg-blue-600 mb-4 md:-mb-4 text-white rounded-full font-medium hover:bg-blue-700 transition-all shadow-md"
            >
              Faça do jeito certo!
            </Link>
          </motion.div>
        </div>

        {/* Container de imagens */}
        <div className="relative z-20 max-w-6xl mx-auto flex flex-col md:flex-row gap-6 justify-center items-center">
          {[
            { src: "/mockups/5.png", alt: "Dashboard de Acompanhamento de Resultados" },
          ].map((img, i) => (
            <div key={i} className="relative">
            <motion.img
              key={i}
              src={img.src}
              alt={img.alt}
              className="w-full max-w-[400px] lg:max-w-[800px] aspect-video object-cover0"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[80%] h-6 rounded-full bg-blue-900/50 blur-xl z-0" />
            </div>
          ))}
        </div>

        {/* Fundo inferior de transição */}
        
        <div className="absolute inset-x-0 bottom-0 h-80 bg-blue-100" />
      </section>

      {/* Benefícios */}
      <section ref={benefitsRef} className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16 "
          >
            <h2 className="text-3xl font-bold mb-4 tracking-tight">Simplifique sua gestão</h2>
            <div className="max-w-2xl text-gray-600 text-base text-sm py-2 mx-auto text-center">
              <p>
                SingleKey é uma ferramenta simples de usar e que utiliza IA para te ajudar a criar metas claras, organizar indicadores e alinhar todo o time.
              </p>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {[{
              icon: <Users className="w-8 h-8 text-blue-600" />,
              title: 'Clareza e alinhamento',
              description: 'Todos na mesma direção, sem ruído.',
              color: 'bg-blue-600 text-white'
            }, {
              icon: <Clock className="w-8 h-8 text-blue-600" />,
              title: 'Economia de tempo no planejamento',
              description: 'Organize sua empresa e sua equipe em minutos.',
              color: 'bg-blue-600 text-white'
            }, {
              icon: <Sparkles className="w-8 h-8 text-blue-600" />,
              title: 'IA aplicada à gestão de metas',
              description: 'Indicadores de resultados claros e bem definidas.',
              color: 'bg-blue-600 text-white'
            }, {
              icon: <CheckCircle className="w-8 h-8 text-blue-600" />,
              title: 'Pronto para rodar',
              description: 'Fácil onboarding e baixa curva de aprendizado.',
              color: 'bg-blue-600 text-white'
            }].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={benefitsInView ? { opacity: 1, scale: 1 } : {}}
                whileHover={{ scale: 1.05 }}
                transition={{ delay: index * 0.1 }}
                className={`${benefit.color} p-8 rounded-2xl flex items-center gap-6 hover:shadow-lg hover:shadow-lg transition-all`}
              >
                <div className="bg-white p-4 rounded-full">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{benefit.title}</h3>
                  <p className="text-sm font-normal">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 pt-18 pb-0 bg-gray-50" id="okr">
        <div className="max-w-6xl mx-auto text-center px-6 mb-16">
          <h2 className="text-3xl font-bold mb-4 tracking-tight">Usamos OKRs para organizar seu plano</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-base text-sm">
            Mas não se preocupe com a sigla. Pense nisso como uma forma simples de definir onde quer chegar e como saber se está no caminho certo.
          </p>
        </div>

        {/* Cards explicativos */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl px-6 mx-auto">
          <div className="border border-gray-300 p-8 rounded-2xl text-left">
            <h3 className="text-xl font-semibold text-blue-700 mb-4">Ciclo</h3>
            <p className="text-gray-700 mb-6 text-sm">
              É o período que você define para organizar, priorizar e revisar suas metas.
            </p>
            <h4 className="text-sm font-semibold text-blue-700 mb-4">Exemplos:</h4>
            <ul className="text-gray-600 space-y-2 list-disc list-inside text-sm">
              <li>Janeiro a Março — Ciclo de Abertura</li>
              <li>Abril a Junho — Ciclo de Expansão</li>
              <li>Julho a Setembro — Ciclo de Eficiência</li>
            </ul>
          </div>
          <div className="border border-gray-300 p-8 rounded-2xl text-left">
            <h3 className="text-xl font-semibold text-blue-700 mb-4">Objetivo</h3>
            <p className="text-gray-700 mb-6 text-sm">
              Onde você quer chegar ou algo importante que precisa ser alcançado.
            </p>
            <h4 className="text-sm font-semibold text-blue-700 mb-4">Exemplos:</h4>
            <ul className="text-gray-600 space-y-2 list-disc list-inside text-sm">
              <li>Ser referência em atendimento</li>
              <li>Construir uma comunidade fiel</li>
              <li>Dominar o mercado digital</li>
            </ul>
          </div>

          <div className="border border-gray-300 p-8 rounded-2xl text-left">
            <h3 className="text-xl font-semibold text-indigo-700 mb-4">Resultado-Chave</h3>
            <p className="text-gray-700 mb-6 text-sm">
              São formas de medir se está funcionando. Métricas claras e mensuráveis.
            </p>
            <h4 className="text-sm font-semibold text-blue-700 mb-4">Exemplos:</h4>
            <ul className="text-gray-600 space-y-2 list-disc list-inside text-sm">
              <li>Aumentar o ticket médio em 15%</li>
              <li>Ter 50 avaliações 5 estrelas</li>
              <li>Gerar 30 orçamentos por semana</li>
            </ul>
          </div>
        </div>


        {/* Rodapé com validação social */}
        <div className="relative max-full mx-auto mt-20 text-blue-700 text-center bg-gray-200 p-8">
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-gray-200" />
          <h3 className="text-md font-semibold mb-1">
            Google, Netflix, Nubank e Amazon usam OKRs para crescer com foco.
          </h3>
          <p className="text-sm">E agora, negócios como o seu também.</p>
        </div>
      </section>


      {/* Call to Action */}
      <section className="py-24 px-6 bg-gradient-to-tl from-blue-600 to-indigo-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold mb-2 text-white">
            Pronto aumentar os resultados da sua empresa?
          </h2>
          <p className="text-sm text-white mb-10">É grátis! Clique, crie sua conta e leve mais eficácia para o seu time.</p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/register"
              target="_blank"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-700 rounded-full font-medium hover:bg-blue-100 transition-all shadow-lg hover:shadow-xl"
            >
              Começar agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <footer className="bg-gray-50 text-center text-sm text-gray-500 py-6">
     <p>
       © {new Date().getFullYear()} SingleKey. Todos os direitos reservados.
     </p>
   </footer>
    </div>
  );
}
