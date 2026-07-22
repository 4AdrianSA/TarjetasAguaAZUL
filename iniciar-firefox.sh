#!/bin/bash
echo "Iniciando servidor local..."
echo "Abre http://localhost:3000 en tu navegador"
echo "Presiona Ctrl+C para cerrar"
echo ""

# Iniciar servidor en background
npx serve -s . -l 3000 --no-clipboard &
SERVER_PID=$!

sleep 2

# Abrir en Firefox
if command -v firefox &> /dev/null; then
    firefox http://localhost:3000
else
    echo "No se encontro Firefox. Abri manualmente: http://localhost:3000"
fi

echo "Servidor corriendo. Presiona Ctrl+C para cerrar."
wait $SERVER_PID
