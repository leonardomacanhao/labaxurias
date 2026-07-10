#!/bin/bash

echo "=== Verificando se o backend foi atualizado ==="
if grep -q "isCalled = qi.IsCalled" src/Labaxurias.Api/Modules/Session/Controllers/SessionController.cs; then
    echo "✅ Código atualizado encontrado"
else
    echo "❌ Código NÃO atualizado - aplicando agora..."
    # O código já foi atualizado anteriormente, mas vamos confirmar
fi

echo ""
echo "=== Matando processos do backend ==="
pkill -f "dotnet run"
pkill -f "Labaxurias.Api"
sleep 2

echo ""
echo "=== Reiniciando o backend ==="
cd src/Labaxurias.Api
nohup dotnet run > /tmp/backend.log 2>&1 &

echo "Aguardando backend iniciar..."
sleep 8

echo ""
echo "=== Testando endpoint ==="
curl -s http://localhost:5291/api/session/2026-07-09 | grep -o '"isCalled":[^,]*' | head -3

echo ""
echo "=== Verificando logs ==="
tail -20 /tmp/backend.log
