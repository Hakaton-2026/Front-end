
import { inject, reactive, readonly } from 'vue'

const CHAVE_TEMA = 'tema'

const estado = reactive({
  atual: 'escuro'
})

function aplicarTema() {
  document.documentElement.setAttribute(
    'data-theme',
    estado.atual
  )

  localStorage.setItem(CHAVE_TEMA, estado.atual)
}

function definirTema(novoTema) {
  if (!['claro', 'escuro'].includes(novoTema)) {
    return
  }

  estado.atual = novoTema
  aplicarTema()
}

function alternarTema() {
  definirTema(
    estado.atual === 'escuro' ? 'claro' : 'escuro'
  )
}

export const temaPlugin = {
  install(app) {
    const temaSalvo = localStorage.getItem(CHAVE_TEMA)

    estado.atual =
      temaSalvo === 'claro' || temaSalvo === 'escuro'
        ? temaSalvo
        : 'escuro'

    aplicarTema()

    app.provide('tema', {
      estado: readonly(estado),
      definirTema,
      alternarTema
    })
  }
}

export function useTema() {
  const tema = inject('tema')

  if (!tema) {
    throw new Error(
      'O plugin de tema não foi registrado no main.js.'
    )
  }

  return tema
}
