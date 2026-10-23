import apiClient from './config'

const authApi = {
  register(data) {
    return apiClient.post('/registro/', data)
  },

  login(email, password) {
    return apiClient.post('/token/', {
      email,
      password,
    })
  },

  me() {
    return apiClient.get('/usuarios/me/')
  },

  updateMe(data) {
    return apiClient.patch('/usuarios/me/', data)
  },

  changePassword(currentPassword, newPassword) {
    return apiClient.post('/usuarios/change_password/', {
      current_password: currentPassword,
      new_password: newPassword,
    })
  },

  uploadImage(file, description = '') {
    const formData = new FormData()

    formData.append('file', file)

    if (description) {
      formData.append('description', description)
    }

    return apiClient.post('/media/images/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  verifyEmail(email, codigo) {
    return apiClient.post('/verificar-email/', {
      email,
      codigo,
    })
  },

  resendVerificationCode(email) {
    return apiClient.post('/reenviar-codigo/', {
      email,
    })
  },
}

export default authApi