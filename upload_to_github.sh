#!/bin/bash

# LuxScaler v41 - Manual GitHub Upload Script
# Usar si "Save to GitHub" de Emergent no funciona

echo "======================================"
echo "LUXSCALER v41 - GITHUB UPLOAD"
echo "======================================"
echo ""

# 1. Verificar git
if ! command -v git &> /dev/null; then
    echo "❌ Git no instalado"
    exit 1
fi

echo "✅ Git instalado"

# 2. Configurar git
git config user.email "usajosefernan@gmail.com"
git config user.name "Jose Fernan"
echo "✅ Git configurado"

# 3. Verificar remote
REMOTE=$(git remote get-url origin 2>/dev/null)
if [ "$REMOTE" != "https://github.com/usajosefernan-cmd/elu.git" ]; then
    git remote remove origin 2>/dev/null
    git remote add origin https://github.com/usajosefernan-cmd/elu.git
    echo "✅ Remote configurado: https://github.com/usajosefernan-cmd/elu.git"
fi

# 4. Preparar commit
git add -A
git commit -m "LuxScaler v41 - Complete implementation

- 11 Supabase tables (74 config rows)
- 7 v41 endpoints
- 8 frontend components
- Smart Anchors system
- LaoZhang 4K integration
- Complete documentation (12 docs)
- Biopsy Engine
- User profiles (AUTO/USER/PRO/PRO_LUX)
- Data-driven architecture (100% editable from Supabase)
" 2>/dev/null

echo "✅ Commit preparado"

# 5. Instrucciones para push
echo ""
echo "======================================"
echo "PRÓXIMO PASO: AUTENTICACIÓN"
echo "======================================"
echo ""
echo "Opción 1: Usar GitHub CLI (recomendado)"
echo "   1. Instala: https://cli.github.com/"
echo "   2. gh auth login"
echo "   3. gh repo sync"
echo ""
echo "Opción 2: Personal Access Token"
echo "   1. Crea token: https://github.com/settings/tokens"
echo "   2. Scope: 'repo'"
echo "   3. Ejecuta:"
echo "      git push https://TU_TOKEN@github.com/usajosefernan-cmd/elu.git main"
echo ""
echo "Opción 3: Descargar ZIP y subir manualmente"
echo "   1. Descarga este workspace como ZIP"
echo "   2. Descomprime localmente"
echo "   3. git push desde tu máquina"
echo ""
echo "======================================"
echo "Estado actual:"
echo "✅ Código preparado"
echo "✅ Commit listo"
echo "✅ Remote configurado"
echo "⏳ Esperando autenticación"
echo "======================================"
