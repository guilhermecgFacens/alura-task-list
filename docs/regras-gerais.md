# REGRAS OBRIGATÓRIAS

Estas regras têm prioridade máxima e devem ser consideradas **ANTES E DURANTE CADA AÇÃO** executada no projeto.

## 1. CONCISÃO

* Responda sempre de forma **extremamente concisa**.
* Sacrifique gramática, explicações e detalhes não essenciais em favor da concisão.
* Não repita informações já fornecidas.
* Não forneça contexto ou explicações que não sejam necessários para executar a tarefa.

## 2. NUNCA INSTALAR NADA SEM PERMISSÃO

É **PROIBIDO**, sem exceção, instalar qualquer coisa no projeto ou no ambiente.

Isso inclui, mas não se limita a:

* Pacotes NPM
* Dependências de qualquer gerenciador de pacotes
* Bibliotecas
* CLIs
* Ferramentas
* Extensões
* Binários
* Scripts externos
* Qualquer software ou recurso de terceiros

### REGRA OBRIGATÓRIA

Antes de executar **qualquer comando que possa instalar, baixar ou adicionar algo**, você DEVE:

1. **PARAR.**
2. Informar exatamente o que será instalado/baixado.
3. **PEDIR MINHA PERMISSÃO EXPLÍCITA.**
4. Fazer uma **varredura completa na internet** sobre o pacote/ferramenta/recurso.
5. Verificar se existem relatos ou evidências de:

   * código malicioso;
   * malware;
   * supply-chain attack;
   * pacote comprometido;
   * comportamento suspeito;
   * vulnerabilidades relevantes;
   * versões comprometidas;
   * histórico recente de comprometimento.
6. Só executar a instalação após:

   * minha permissão explícita; e
   * conclusão da verificação na internet.

**Nunca presuma minha permissão.**

**Nunca instale primeiro e pergunte depois.**

## 3. COMANDOS DE CONSOLE

A mesma regra se aplica a **comandos de console**.

Antes de executar um comando, avalie se ele:

* instala algo;
* baixa algo;
* altera dependências;
* executa código obtido externamente;
* adiciona software ao ambiente;
* modifica o sistema fora do escopo necessário.

Se qualquer uma dessas condições for verdadeira:

**PARE → INFORME → PESQUISE → PEÇA PERMISSÃO → SÓ ENTÃO EXECUTE.**

## 4. NÃO USAR TODO

É **PROIBIDO** inserir comentários contendo:

```text
TODO:
```

em qualquer arquivo, código ou documentação.

Não substitua `TODO:` por outra variação com a mesma finalidade sem necessidade.

## 5. VERIFICAÇÃO CONTÍNUA

A cada passo da execução:

1. Releia estas regras mentalmente.
2. Verifique se a próxima ação viola alguma delas.
3. Se houver risco de violação, **PARE antes de executar a ação**.
4. Nunca priorize velocidade sobre estas regras.

Estas regras permanecem válidas durante **toda a tarefa**, não apenas no início.
