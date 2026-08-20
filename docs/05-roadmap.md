05 — Roadmap — Diário APLV

Objetivo

Colocar o Diário APLV em uso real o mais rápido possível, priorizando segurança, persistência, registro em poucos toques, timeline confiável e relatório clínico organizado.

Princípio central de UX

O Diário APLV deve funcionar como um diário visual de registro rápido.

Requisitos:

Home com atalhos grandes e visuais;

ações principais a 1 toque;

sintomas organizados por categoria;

intensidade marcada por toque;

horário preenchido automaticamente;

observação sempre opcional;

mínimo de digitação;

feedback imediato de salvamento.

Meta:

Registrar exposição, sintoma ou fralda em menos de 30 segundos.

Mensagem fixa:

Registre apenas o que realmente observar. Não é necessário procurar sintomas.

Direção visual

Interface acolhedora, simples, limpa, moderna e confiável, sem parecer hospitalar e sem excesso de elementos infantis.

Sugestão de cores:

Primary: #6F57E8

Background: #F7F5FB

Text: #262432

Muted: #747181

Danger: #B63B53

Home — atalhos principais

A tela inicial deve mostrar, com ícone + nome e área de toque grande:

Exposição

Sintomas

Sem sintomas

Fralda

Observação

Timeline

Etapas

Relatório

Qualquer ação principal deve estar a no máximo 1 toque da Home.

Registro rápido de sintomas

Evitar formulário longo. Usar lista visual com intensidade por toque.

Exemplo:

Muco nas fezes
[ Leve ] [ Moderada ] [ Intensa ]

Sangue nas fezes
[ Leve ] [ Moderada ] [ Intensa ]

Regurgitação
[ Leve ] [ Moderada ] [ Intensa ]

Ao selecionar:

sintoma fica ativo;

intensidade é registrada;

horário atual é preenchido;

usuária pode marcar outros sintomas;

observação continua opcional.

Não usar manhã/tarde/noite como dado principal. Usar horário real.

Categorias de sintomas

Gastrointestinais / Fezes

Muco nas fezes

Sangue nas fezes

Diarreia

Mais evacuações que o habitual

Constipação

Regurgitação

Vômito

Distensão abdominal

Desconforto aparente

Recusa da mamada

Pele

Dermatite / eczema

Vermelhidão

Urticária

Inchaço

Respiratórios / Estado geral

Tosse / chiado

Dificuldade para respirar

Irritabilidade diferente do habitual

Choro intenso

Palidez importante

Sonolência / prostração

Outros

Outro

Horário

Todo registro deve ter occurred_at, preenchido automaticamente com data/hora atual e editável pela usuária.

Feedback de salvamento

Todo formulário deve ter:
idle → saving → success/error

Durante saving, desabilitar o botão para evitar duplicidade.

Sequência dos módulos

#

Módulo

Entrega verificável

Estimativa

M0

Fundação

App roda, build/TypeScript limpos

0,5 dia

M1

Supabase + Schema + RLS

Banco criado e isolamento validado

0,5–1 dia

M2

Auth + Rotas Protegidas

Cadastrar, entrar, sair, sessão persistida

0,5 dia

M3

Onboarding

Criança + acompanhamento persistidos

0,5 dia

M4

Shell + Dashboard visual

/app mostra criança, etapa e atalhos

0,5 dia

M5

Exposição

Registrar, salvar e recuperar exposição

0,5 dia

M6

Sintomas rápidos

Registro por toque, intensidade, horário, sem sintomas e vínculo com exposição

0,5–1 dia

M7

Timeline essencial

Exposições + sintomas persistentes e ordenados

0,5 dia

M8

Fralda + observações

Registrar fralda e nota

0,5 dia

M9

Etapas

Avançar/repetir/retornar com histórico imutável

0,5 dia

M10

Relatório

Relatório completo + impressão/PDF

0,5–1 dia

M11

Design System

Padronização visual

0,5 dia

M12

PWA + QA

Instalável, responsivo e validado

0,5–1 dia

Estimativa enxuta do MVP completo: ~6 a 8 dias de trabalho focado.

Caminho crítico

M0 → M1 → M2 → M3 → M4 → M5 → M6 → M7
↓
MARCO DE USO REAL
↓
M8 → M9 → M10
↓
MVP COMPLETO
↓
M11 → M12

Marco de Uso Real

Após M7, a mãe já consegue:

entrar;

abrir o acompanhamento;

registrar exposição;

registrar sintomas em poucos toques;

registrar ausência de sintomas;

fechar;

entrar novamente;

encontrar tudo salvo.

Não esperar Design System, animações ou PWA para iniciar uso controlado.

M0 — Fundação

Entregas:

projeto;

TypeScript;

estrutura de pastas;

variáveis de ambiente;

Supabase preparado;

lint;

build.

Aceite:

npm run build
tsc --noEmit

sem erros.

M1 — Supabase, Schema e RLS

Criar:

children

protocols

stage_history

exposures

symptom_events

symptom_event_items

diaper_records

notes

Obrigatório:

migrations versionadas;

tipos TypeScript gerados;

RLS testada com Usuário A e Usuário B;

A não pode SELECT/UPDATE/DELETE dados de B;

A não pode inserir usando user_id de B.

M2 — Auth

cadastro;

login;

logout;

sessão persistente;

rotas protegidas.

Aceite: fechar/abrir ou logout/login não pode provocar perda de dados.

M3 — Onboarding

Criança:

nome/apelido;

nascimento;

alimentação atual.

Acompanhamento:

início;

motivo;

profissional opcional;

status = active;

current_stage = 1.

Aceite: criar → refresh → continua presente.

M4 — Shell + Dashboard visual

Mostrar:

criança;

etapa atual;

dia da etapa;

progresso 1/5;

atalhos principais.

Layout:

[ Exposição ] [ Sintomas ]
[ Sem sintomas ] [ Fralda ]
[ Observação ] [ Timeline ]
[ Etapas ] [ Relatório ]

M5 — Exposição

Fluxo:
Home → Exposição → preencher → Salvar

Campos:

alimento;

quantidade;

data/hora automática;

observação opcional.

Quantidade:

Pequena

Habitual

Maior que o habitual

Não sei

Aceite:
salvar → confirmação → refresh → logout/login → registro permanece.

M6 — Sintomas rápidos

Evitar formulário tradicional.

Permitir:

múltiplos sintomas;

intensidade;

data/hora;

observação;

vínculo opcional com exposição.

Botão separado:
SEM SINTOMAS

Salvar:

no_symptoms = true;

horário;

etapa.

Temporalidade:
symptom.occurred_at - exposure.occurred_at

Exibir:

8h40 após exposição

Nunca exibir causalidade.

Aceite de UX:
Home → Sintomas → Muco → Leve → Salvar em poucos segundos.

M7 — Timeline essencial

Unificar no frontend:

exposições;

sintomas;

sem sintomas.

Ordenar por occurred_at DESC.

Não criar tabela timeline.

Aceite:
salvar → refresh → logout → login → tudo permanece na ordem correta.

M8 — Fralda + observações

Registro rápido de fralda:

Sangue:
[ Não ] [ Traços ] [ Visível ]

Muco:
[ Não ] [ Pouco ] [ Moderado ] [ Muito ]

Consistência:
[ Habitual ] [ Líquida ] [ Pastosa ] [ Ressecada ] [ Não sei ]

Também:

horário automático;

observação opcional.

Foto não é obrigatória no MVP.

M9 — Etapas

Etapas:

Preparação assada

Derivado aquecido

Queijo

Iogurte

Leite

Histórico deve ser imutável.

Ao retornar/repetir, criar novo período em stage_history.

Ações:

avançar;

retornar;

repetir.

Confirmar:

Avance apenas se estiver seguindo o plano definido pela equipe assistente.

M10 — Relatório

Incluir:

criança;

alimentação;

período;

motivo;

profissional;

exposições;

sintomas;

sem sintomas;

fraldas;

resumo por etapa;

temporalidade;

timeline completa.

Tabela de temporalidade:

Data/hora

Sintoma

Intensidade

Intervalo

Aviso:

Este relatório organiza os dados registrados pela família. Ele não estabelece diagnóstico de APLV e deve ser interpretado pelo profissional de saúde responsável.

MVP pode usar window.print().

M11 — Design System

Criar/padronizar:

Button

ActionTile

Input

Select

Textarea

SymptomRow

SeveritySelector

Chip

Card

Modal

Alert

Badge

Loading

Toast

Página /dev.

Não alterar regra de negócio.

M12 — PWA + QA

manifest;

service worker;

instalável;

responsivo;

ícones;

theme color.

Testar em:

375px

390px

430px

desktop

QA de usabilidade:

ações principais visíveis;

toque confortável;

sem zoom;

pouco texto livre;

horário automático;

feedback imediato;

retorno simples à Home.

Regras gerais

Critério de aceite é a porta do próximo módulo.

Persistência faz parte da funcionalidade.

Todo formulário tem idle/saving/success/error.

Funcional antes de bonito.

Um commit por entregável.

npm run build + tsc --noEmit limpos.

Nunca desativar RLS para ganhar velocidade.

Qualquer ação principal a 1 toque da Home.

Digitação é exceção; preferir botão/chip/seletor.

Horário atual automático em todo evento.

Cortes de escopo se o prazo apertar

React Bits / animações.

Offline avançado / IndexedDB.

Instalação PWA.

Observação livre.

Editar registro.

Nunca cortar

Supabase;

RLS;

autenticação;

persistência;

feedback de salvamento;

horário automático;

exposição;

sintomas;

sem sintomas;

timeline;

relatório;

experiência de registro rápido.

Prioridade absoluta

SEGURANÇA DOS DADOS
↓
PERSISTÊNCIA
↓
REGISTRO EM POUCOS TOQUES
↓
TIMELINE
↓
RELATÓRIO
↓
DESIGN
↓
ANIMAÇÕES

O Diário APLV deve entrar em uso controlado assim que o M7 estiver validado.
