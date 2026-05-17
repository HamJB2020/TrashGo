document.addEventListener('DOMContentLoaded', () => {
    const solicitudForm = document.getElementById('solicitudForm');
    const residueType = document.getElementById('residueType');
    const urgency = document.getElementById('urgency');
    const approxCost = document.getElementById('approxCost');

    const calculateApproxCost = () => {
        let cost = 0;
        switch (residueType.value) {
            case 'normal':
                cost += 5.00;
                break;
            case 'reciclaje':
                cost += 3.00;
                break;
            case 'especial':
                cost += 10.00;
                break;
        }

        if (urgency.value === 'alta') {
            cost *= 1.5; // Aumentar el costo en un 50% para urgencia alta
        }

        approxCost.textContent = `${cost.toFixed(2)} €`;
    };

    residueType.addEventListener('change', calculateApproxCost);
    urgency.addEventListener('change', calculateApproxCost);
    calculateApproxCost(); // Initial calculation

    solicitudForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Solicitud de recogida enviada! (Funcionalidad completa requiere backend)');
        // Aquí iría la lógica para enviar los datos al backend
    });

    const registroForm = document.getElementById('registroForm');
    registroForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Registro de usuario exitoso! (Funcionalidad completa requiere backend)');
        // Aquí iría la lógica para registrar al usuario en el backend
    });
});