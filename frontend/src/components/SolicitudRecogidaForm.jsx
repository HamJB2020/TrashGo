import React, { useState } from 'react';
import api from '../services/api';

export default function SolicitudRecogidaForm({ simple }) {
  const [formData, setFormData] = useState({
    direccion: '',
    tipoResiduo: 'mixto',
    descripcion: '',
    urgencia: 'normal',
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.direccion.trim()) {
      nuevosErrores.direccion = 'La dirección es obligatoria';
    } else if (formData.direccion.length < 10) {
      nuevosErrores.direccion = 'La dirección debe tener al menos 10 caracteres';
    }

    const tiposValidos = ['orgánico', 'inorgánico', 'mixto', 'especial'];
    if (!tiposValidos.includes(formData.tipoResiduo)) {
      nuevosErrores.tipoResiduo = 'Tipo de residuo inválido';
    }

    if (formData.descripcion && formData.descripcion.length < 5) {
      nuevosErrores.descripcion = 'La descripción debe tener al menos 5 caracteres';
    }

    return nuevosErrores;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setErrorMessage('');
    setSuccessMessage('');

    const validationErrors = validarFormulario();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/recogidas', formData);

      const recogidaId = response.data.data.recogidaId;
      setSuccessMessage(
        `✅ Solicitud creada exitosamente. ID: ${recogidaId}`
      );

      setTimeout(() => {
        setFormData({
          direccion: '',
          tipoResiduo: 'mixto',
          descripcion: '',
          urgencia: 'normal',
        });
        setSuccessMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error al crear recogida:', error);

      if (error.response?.data?.error) {
        setErrorMessage(error.response.data.error);
      } else if (error.message === 'Network Error') {
        setErrorMessage(
          'Error de conexión. Verifica tu conexión a internet.'
        );
      } else {
        setErrorMessage('Error desconocido. Intenta nuevamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={simple ? '' : 'min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4'}>
      <div className={simple ? '' : 'max-w-2xl mx-auto'}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🗑️ TrashGo
          </h1>
          <p className="text-lg text-gray-600">
            Solicita recolección de residuos a domicilio
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          
          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg animate-pulse">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div>
              <label 
                htmlFor="direccion" 
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                📍 Dirección de Recogida *
              </label>
              <input
                id="direccion"
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                placeholder="Ej: Calle Principal 123, Apartado 4B, Madrid"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
                  errors.direccion
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 bg-white'
                }`}
              />
              {errors.direccion && (
                <p className="text-red-600 text-sm mt-1">❌ {errors.direccion}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Mínimo 10 caracteres. Incluye código postal.
              </p>
            </div>

            <div>
              <label 
                htmlFor="tipoResiduo" 
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                ♻️ Tipo de Residuo *
              </label>
              <select
                id="tipoResiduo"
                name="tipoResiduo"
                value={formData.tipoResiduo}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white transition"
              >
                <option value="mixto">Mixto (diferentes tipos)</option>
                <option value="orgánico">Orgánico (restos de comida, plantas)</option>
                <option value="inorgánico">Inorgánico (plástico, metal, papel)</option>
                <option value="especial">Especial (electrónica, químicos)</option>
              </select>
              {errors.tipoResiduo && (
                <p className="text-red-600 text-sm mt-1">❌ {errors.tipoResiduo}</p>
              )}
            </div>

            <div>
              <label 
                htmlFor="descripcion" 
                className="block text-sm font-semibold text-gray-700 mb-2"
              >
                📝 Descripción Adicional (Opcional)
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                placeholder="Ej: 3 bolsas grandes, incluye vidrio"
                rows="4"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition resize-none ${
                  errors.descripcion
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 bg-white'
                }`}
              />
              {errors.descripcion && (
                <p className="text-red-600 text-sm mt-1">❌ {errors.descripcion}</p>
              )}
            </div>

            <div>
              <label htmlFor="urgencia" className="block text-sm font-semibold text-gray-700 mb-2">
                ⚡ Nivel de Urgencia
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="urgencia"
                    value="normal"
                    checked={formData.urgencia === 'normal'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-green-500"
                  />
                  <span className="ml-2 text-gray-700">Normal (24-48h)</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="urgencia"
                    value="alta"
                    checked={formData.urgencia === 'alta'}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-yellow-500"
                  />
                  <span className="ml-2 text-gray-700">Alta (2-4h)</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Enviando...
                </>
              ) : (
                <>
                  <span>✅ Solicitar Recogida</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-gray-600 text-sm">
            <p>
              💡 Un rider confirmará tu solicitud en poco tiempo.
              <br />
              Recibirás notificaciones en tu email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
