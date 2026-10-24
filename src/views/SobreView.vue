
<template>
  <main class="sobre-container">

    <!-- Apresentação -->
    <section class="hero">
<span class="etiqueta">CONHEÇA O NEXOS</span>

      <h1>Sobre <span>Nós</span></h1>

      <p>
        O Nexos nasceu com o propósito de conectar pessoas,
        ideias e projetos em um único ambiente digital.
        Nossa plataforma busca facilitar a organização,
        a colaboração e o desenvolvimento de novas ideias.
      </p>
    </section>

    <!-- Quem somos -->
    <section class="sobre-conteudo">
      <div class="texto">
        <span class="etiqueta">NOSSA HISTÓRIA</span>

        <h2>Quem somos?</h2>

        <p>
          Somos uma equipe que acredita no poder da tecnologia
          para aproximar pessoas e transformar ideias em realidade.
        </p>

        <p>
          Desenvolvemos o Nexos pensando em oferecer um espaço
          simples, moderno e acessível, onde usuários possam
          gerenciar seus projetos, organizar documentos e
          compartilhar conhecimento.
        </p>
      </div>

      <div class="destaque">
        <ion-icon name="git-network-outline"></ion-icon>

        <h3>Conectando ideias.</h3>

        <p>
          Um espaço para criar, organizar e colaborar.
        </p>
      </div>
    </section>

    <!-- Missão, visão e valores -->
    <section class="principios">
      <div class="titulo-secao">
        <span class="etiqueta">O QUE NOS MOVE</span>
        <h2>Nossos princípios</h2>
      </div>

      <div class="cards">

        <article class="card">
          <ion-icon name="rocket-outline"></ion-icon>
          <h3>Missão</h3>
          <p>
            Facilitar a organização de projetos e incentivar
            a colaboração por meio da tecnologia.
          </p>
        </article>

        <article class="card">
          <ion-icon name="eye-outline"></ion-icon>
          <h3>Visão</h3>
          <p>
            Ser uma plataforma que aproxima pessoas,
            promove ideias e simplifica o trabalho em equipe.
          </p>
        </article>

        <article class="card">
          <ion-icon name="heart-outline"></ion-icon>
          <h3>Valores</h3>
          <p>
            Colaboração, criatividade, inovação,
            acessibilidade e respeito às pessoas.
          </p>
        </article>

      </div>
    </section>

    <!-- Funcionalidades -->
    <section class="funcionalidades">
      <span class="etiqueta">NOSSA PLATAFORMA</span>

      <h2>O que você encontra no Nexos?</h2>

      <p>
        Ferramentas desenvolvidas para tornar sua rotina
        mais organizada e produtiva.
      </p>

      <div class="recursos">
        <div>
          <ion-icon name="folder-open-outline"></ion-icon>
          <span>Gerenciamento de projetos</span>
        </div>

        <div>
          <ion-icon name="document-text-outline"></ion-icon>
          <span>Editor de notas e documentos</span>
        </div>

        <div>
          <ion-icon name="people-outline"></ion-icon>
          <span>Ambiente colaborativo</span>
        </div>

        <div>
          <ion-icon name="star-outline"></ion-icon>
          <span>Organização de favoritos</span>
        </div>
      </div>
    </section>

    <section class="integrantes">
      <div class="titulo-secao">
        <span class="etiqueta">NOSSOS INTEGRANTES</span>
        <h2>Conheça nossa equipe</h2>
      </div>

      <div class="grid-integrantes">
        <article class="membro">
          <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80" alt="Integrante 1" />
          <div class="info">
            <span class="cargo">Frontend</span>
            <h3>Daniel</h3>
            <p>Responsável pela estrutura e pela experiência do usuário.</p>
          </div>
        </article>

        <article class="membro">
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80" alt="Integrante 2" />
          <div class="info">
            <span class="cargo">Design</span>
            <h3>Ana</h3>
            <p>Cuida da identidade visual e da organização da interface.</p>
          </div>
        </article>

        <article class="membro">
          <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80" alt="Integrante 3" />
          <div class="info">
            <span class="cargo">Desenvolvimento</span>
            <h3>Lucas</h3>
            <p>Contribui com a lógica e construção das telas principais.</p>
          </div>
        </article>

        <article class="membro">
          <img src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80" alt="Integrante 4" />
          <div class="info">
            <span class="cargo">Pesquisa</span>
            <h3>Julia</h3>
            <p>Ajudou a definir objetivos e melhorar a apresentação do projeto.</p>
          </div>
        </article>

        <article class="membro">
          <img src="https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80" alt="Integrante 5" />
          <div class="info">
            <span class="cargo">Estratégia</span>
            <h3>Mateus</h3>
            <p>Foca na organização do grupo e no desenvolvimento da visão do app.</p>
          </div>
        </article>
      </div>
    </section>

    <!-- Final -->
    <section class="final">
      <h2>Grandes ideias começam com conexões.</h2>

      <p>
        Nexos — conectando pessoas, organizando ideias
        e construindo possibilidades.
      </p>

      <RouterLink to="/" class="botao">
        Voltar ao início
        <ion-icon name="arrow-forward-outline"></ion-icon>
      </RouterLink>
    </section>

  </main>
</template>

<style scoped>
.sobre-container {
  min-height: 100vh;
  background: var(--cor-fundo, #171717);
  color: var(--cor-texto, #f5f5f5);
  font-family: Inter, system-ui, sans-serif;
}

.sobre-container * {
  box-sizing: border-box;
}

.etiqueta {
  color: var(--cor-primaria, #a855f7);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
}

/* HERO */

.hero {
  text-align: center;
  padding: 100px 24px 90px;
  background: rgba(168, 85, 247, 0.08);
}

.hero h1 {
  font-size: clamp(42px, 6vw, 65px);
  margin: 18px 0;
  letter-spacing: -2px;
}

.hero h1 span {
  color: var(--cor-primaria, #a855f7);
}

.hero p {
  max-width: 680px;
  margin: 0 auto;
  color: var(--cor-texto-suave, #aaa);
  font-size: 17px;
  line-height: 1.8;
}

/* QUEM SOMOS */

.sobre-conteudo {
  max-width: 1100px;
  margin: auto;
  padding: 75px 24px;

  display: grid;
  grid-template-columns: 1.3fr 1fr;
  align-items: center;
  gap: 70px;
}

.texto h2,
.titulo-secao h2,
.funcionalidades h2 {
  font-size: clamp(27px, 3vw, 36px);
  margin: 15px 0 22px;
  color: var(--cor-texto, #f5f5f5);
}

.texto p {
  color: var(--cor-texto-suave, #aaa);
  line-height: 1.9;
  margin-bottom: 15px;
}

.destaque {
  padding: 45px 35px;
  border: 1px solid var(--cor-borda, #383838);
  border-radius: 18px;
  background: var(--cor-superficie, #222);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.08);
}

.destaque ion-icon {
  font-size: 50px;
  color: var(--cor-primaria, #a855f7);
}

.destaque h3 {
  font-size: 24px;
  margin: 25px 0 10px;
  color: var(--cor-texto, #f5f5f5);
}

.destaque p {
  color: var(--cor-texto-suave, #aaa);
  line-height: 1.7;
}

/* PRINCÍPIOS */

.principios {
  padding: 80px 24px;
  background: var(--cor-superficie, #1c1c1c);
}

.titulo-secao {
  text-align: center;
  margin-bottom: 45px;
}

.cards {
  max-width: 1100px;
  margin: auto;

  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.card {
  padding: 32px;
  background: var(--cor-fundo, #242424);
  border: 1px solid var(--cor-borda, #383838);
  border-radius: 14px;
  transition: 0.2s;
}

.card:hover {
  transform: translateY(-5px);
  border-color: var(--cor-primaria, #a855f7);
}

.card ion-icon {
  font-size: 32px;
  color: var(--cor-primaria, #a855f7);
}

.card h3 {
  font-size: 20px;
  margin: 22px 0 12px;
  color: var(--cor-texto, #f5f5f5);
}

.card p {
  color: var(--cor-texto-suave, #aaa);
  line-height: 1.7;
  font-size: 14px;
}

/* FUNCIONALIDADES */

.funcionalidades {
  max-width: 1100px;
  margin: auto;
  padding: 90px 24px;
  text-align: center;
}

.funcionalidades > p {
  color: var(--cor-texto-suave, #aaa);
  margin-bottom: 40px;
}

.recursos {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  text-align: left;
}

.recursos div {
  display: flex;
  align-items: center;
  gap: 15px;

  padding: 22px;
  background: var(--cor-superficie, #222);
  border: 1px solid var(--cor-borda, #383838);
  border-radius: 12px;

  transition: 0.2s;
}

.recursos div:hover {
  border-color: var(--cor-primaria, #a855f7);
  background: rgba(168, 85, 247, 0.08);
}

.recursos ion-icon {
  color: var(--cor-primaria, #a855f7);
  font-size: 25px;
  flex-shrink: 0;
}

.recursos span {
  font-weight: 500;
  color: var(--cor-texto, #f5f5f5);
}

.integrantes {
  padding: 80px 24px;
  background: var(--cor-superficie, #1d1d1d);
}

.grid-integrantes {
  max-width: 1100px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(5, minmax(180px, 1fr));
  gap: 18px;
}

.membro {
  background: var(--cor-fundo, #242424);
  border: 1px solid var(--cor-borda, #383838);
  border-radius: 16px;
  overflow: hidden;
  transition: 0.2s;
}

.membro:hover {
  transform: translateY(-4px);
  border-color: var(--cor-primaria, #a855f7);
}

.membro img {
  width: 100%;
  height: 210px;
  object-fit: cover;
  display: block;
}

.info {
  padding: 18px 16px 20px;
}

.cargo {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  color: var(--cor-primaria, #c084fc);
  margin-bottom: 8px;
}

.info h3 {
  margin: 0 0 10px;
  font-size: 20px;
  color: var(--cor-texto, #f5f5f5);
}

.info p {
  color: var(--cor-texto-suave, #aaa);
  line-height: 1.6;
  font-size: 14px;
  margin: 0;
}

/* FINAL */

.final {
  text-align: center;
  padding: 80px 24px;
  background: rgba(168, 85, 247, 0.06);
}

.final h2 {
  font-size: clamp(25px, 4vw, 36px);
  margin-bottom: 16px;
  color: var(--cor-texto, #f5f5f5);
}

.final p {
  color: var(--cor-texto-suave, #aaa);
  margin-bottom: 30px;
  line-height: 1.7;
}

.botao {
  display: inline-flex;
  align-items: center;
  gap: 10px;

  padding: 13px 24px;

  color: white;
  background: var(--cor-primaria, #9333ea);

  border-radius: 9px;
  text-decoration: none;
  font-weight: 600;
  transition: 0.2s;
}

.botao:hover {
  background: var(--cor-primaria-hover, #a855f7);
  transform: translateY(-2px);
}

/* RESPONSIVIDADE */

@media (max-width: 1100px) {
  .grid-integrantes {
    grid-template-columns: repeat(3, minmax(180px, 1fr));
  }
}

@media (max-width: 820px) {
  .sobre-conteudo {
    grid-template-columns: 1fr;
    gap: 30px;
    padding: 55px 20px;
  }

  .cards {
    grid-template-columns: 1fr 1fr;
  }

  .grid-integrantes {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 70px 20px;
  }

  .hero p {
    font-size: 15px;
  }

  .cards,
  .recursos,
  .grid-integrantes {
    grid-template-columns: 1fr;
  }

  .principios,
  .funcionalidades,
  .integrantes {
    padding: 60px 20px;
  }

  .final {
    padding: 65px 20px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card,
  .recursos div,
  .botao {
    transition: none;
  }
}
</style>
