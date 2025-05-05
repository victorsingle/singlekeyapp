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
      <section className="relative px-6 py-20 sm:py-36 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
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
            <h2 className="text-5xl font-bold bg-clip-text py-3 text-transparent bg-gradient-to-r from-blue-600 to-indigo-900 tracking-tighter">
              Estratégia do jeito simples
            </h2>
            <p className="text-xl text-gray-700 mb-10 leading-relaxed">
             Alinhe seu time e organize seus indicadores de resultados com a KAI, sua IA de gestão.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  to="/register"
                  target="_blank"
                  className="w-full sm:w-auto sm:max-w-max inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <Target className="w-5 h-5 mr-2" />
                  Criar conta gratuita
                </Link>
              </motion.div>
              <motion.div>
              <Link 
                  to="/login"
                  target="_blank"
                  className="w-full sm:w-auto sm:max-w-max inline-flex ml-0 sm:ml-4 items-center px-8 py-4 bg-white text-blue-600 rounded-full font-medium hover:bg-blue-200 hover:text-blue-900 transition-all shadow-lg hover:shadow-xl"
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
            <h2 className="text-3xl font-bold mb-4">Como funciona</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
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
                <p className="text-gray-600 text-center">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* Seção com mockups em destaque */}
      <section className="relative bg-gradient-to-b from-white via-blue-50 to-indigo-50 py-24 px-6 text-center">
        <div className="relative z-10 max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl font-bold mb-4 tracking-tight"
          >
            Veja o SingleKey em ação
          </motion.h2>
          <p className="text-gray-600 text-base md:text-lg mb-8">
            Crie Ciclos de Planejamento e acompanhe suas evoluções com visual claro e direto.
          </p>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              to="/register"
              target='_blank'
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-all shadow-md"
            >
              Experimente Agora
            </Link>
          </motion.div>
        </div>

        {/* Container de imagens */}
        <div className="relative z-20 max-w-6xl mx-auto flex flex-col md:flex-row gap-6 justify-center items-center">
          {[
            { src: "/mockups/1.png", alt: "Geraçao Automática com IA" },
            { src: "/mockups/3.png", alt: "Dashboard de Acompanhamento de Resultados" },
            { src: "/mockups/2.png", alt: "Gestão de Ciclos de Planejamento" },
          ].map((img, i) => (
            <motion.img
              key={i}
              src={img.src}
              alt={img.alt}
              className="rounded-xl shadow-xl border border-gray-200 w-full max-w-[400px] lg:max-w-[600px] aspect-video object-cover"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            />
          ))}
        </div>

        {/* Fundo inferior de transição */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent z-0" />
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
            <h2 className="text-3xl font-bold mb-4">Benefícios</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
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
              description: 'Planeje rápido e mais foco nas iniciatias.',
              color: 'bg-blue-600 text-white'
            }, {
              icon: <Sparkles className="w-8 h-8 text-blue-600" />,
              title: 'IA aplicada à gestão de metas',
              description: 'Indicadores organizados e bem definidas.',
              color: 'bg-blue-600 text-white'
            }, {
              icon: <CheckCircle className="w-8 h-8 text-blue-600" />,
              title: 'Pronto para rodar em minutos',
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

      {/* Planos */}
      <section className="py-24 px-6 bg-gray-100" id="planos">
        <div className="max-w-6xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-3xl font-bold mb-12"
          >
          <h2 className="text-3xl font-bold mb-4">Planos sob medida</h2>
          <div className="w-24 h-1 bg-blue-600 mx-auto"></div>
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[{
              name: "Basic",
              price: "R$ 29,90",
              suffixText: "/ mês",
              suffixColor: "text-gray-400",
              description: "Ideal para começar com foco.",
              features: [
                "1 usuário",
                "Criação de até 2 ciclos",
                "Alerta de Checkins",
                "Dashboard básico",
                "Até 10.000,00/Mês Tokens"
              ],
              cta: "Assinar Basic",
              highlighted: false
            }, {
              name: "Standard",
              price: "R$ 69,90",
              suffixText: "/ mês",
              suffixColor: "text-white",
              description: "Preferido pelos pequenos times e negócios.",
              features: [
                "Até 10 usuários",
                "Cadastro e Gestão de Times",
                "Criação de até 4 ciclos",
                "Alerta de Checkins",
                "Placar de Checkins",
                "Até 80.000,00/Mês Tokens"
              ],
              cta: "Assinar Plus",
              highlighted: true
            }, {
              name: "Premium",
              price: "R$ 129,90",
              suffixText: "/ mês",
              suffixColor: "text-gray-400",
              description: "Para empresas grandes com visão e escala.",
              features: [
                "Usuários Ilimitados",
                "Cadastro e Gestão de Times",
                "Criação de até 4 ciclos",
                "Alerta de Checkins",
                "Placar de Checkins",
                "Resultados por Times",
                "Até 200.000,00/Mês Tokens"
              ],
              cta: "Assinar Premium",
              highlighted: false
            }].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex flex-col rounded-3xl border shadow-xl overflow-hidden ${
                  plan.highlighted
                    ? 'bg-gradient-to-br from-blue-700 to-indigo-800 text-white scale-[1.02]'
                    : 'bg-white text-gray-900'
                }`}
              >
                <div className="px-8 py-8 text-left">
                  <h3 className={`text-3xl  font-semibold font-light mb-4 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-4xl tracking-tighter font-bold mb-1 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>
                  {plan.price}
                  {plan.suffixText && (
                    <span className={`text-base font-medium ${plan.suffixColor || 'text-gray-400'} ml-1`}>
                      {plan.suffixText}
                    </span>
                  )}
                </p>
                  <p className={`text-sm mb-8 ${plan.highlighted ? 'text-white/80' : 'text-gray-500'}`}>
                    {plan.description}
                  </p>
                  <button
                    className={`flex w-full justify-center px-8 py-4 bg-white text-blue-700 rounded-full font-medium hover:bg-blue-100 hover:shadow-xl transition-all ${
                      plan.highlighted
                        ? 'bg-white text-blue-700'
                        : 'bg-white text-blue-700 border hover:bg-blue-700 hover:text-white '
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
                <hr className={plan.highlighted ? 'border-white/20' : 'border-gray-200'} />
                <ul className={`text-sm px-8 py-8 space-y-3 text-left ${plan.highlighted ? 'text-white/90' : 'text-gray-800'}`}>
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className={`w-4 h-4 shrink-0 mt-1 ${plan.highlighted ? 'text-white' : 'text-green-500'}`} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
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
          <p className="text-sm text-white mb-10">Clique e leve mais eficiênica e eficácia para o seu time.</p>
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
