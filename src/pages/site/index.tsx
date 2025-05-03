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
      <section className="relative px-6 py-28 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50">
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
            <h2 className="text-5xl font-bold bg-clip-text py-2 text-transparent bg-gradient-to-r from-blue-600 to-indigo-900 tracking-tighter">
              Crie e acompanhe OKRs com foco e clareza
            </h2>
            <p className="text-sm text-gray-700 mb-10 leading-relaxed">
              O SingleKey e KAI, nossa agente de IA, ajudam sua equipe a transformar estratégia em execução.
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
      <section id="como-funciona" className="py-24 px-6 bg-white">
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
              title: 'Contexto → Objetivos',
              description: 'Descreva seu foco e a IA gera objetivos alinhados automaticamente.'
            }, {
              icon: <Goal className="w-20 h-20 text-blue-600" />,
              title: 'Resultados-Chave Inteligentes',
              description: 'Métricas claras, acompanhadas com sugestões e check-ins periódicos.'
            }, {
              icon: <Gauge className="w-20 h-20 text-blue-600" />,
              title: 'Acompanhamento fluido',
              description: 'Alertas, progresso e histórico em uma interface leve e contextual.'
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
              description: 'Planeje rápido, execute melhor.',
              color: 'bg-blue-600 text-white'
            }, {
              icon: <Sparkles className="w-8 h-8 text-blue-600" />,
              title: 'IA aplicada à gestão de metas',
              description: 'Metas inteligentes, sem esforço.',
              color: 'bg-blue-600 text-white'
            }, {
              icon: <CheckCircle className="w-8 h-8 text-blue-600" />,
              title: 'Pronto para rodar em minutos',
              description: 'Sem curva de aprendizado.',
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

      {/* Call to Action */}
      <section className="py-24 px-6 bg-gradient-to-tl from-blue-600 to-indigo-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold mb-2 text-white">
            Pronto aumentar os resultados da sua equipe?
          </h2>
          <p className="text-sm text-white mb-10">Clique e leve mais eficiênica e eficácia pra sua empresa.</p>
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
