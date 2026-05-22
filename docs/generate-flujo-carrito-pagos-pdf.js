const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, 'flujo-carrito-pagos.pdf');

const pages = [
  {
    title: 'Flujo de compra',
    subtitle: 'Carrito, Stripe, stock, pedidos y emails',
    lines: [
      'Resumen general:',
      '',
      '1. El usuario anade productos al carrito.',
      '2. El carrito guarda una intencion de compra, no reserva stock.',
      '3. Al pagar, el backend crea una sesion de Stripe Checkout.',
      '4. Stripe cobra al usuario y avisa al backend.',
      '5. El backend comprueba el pago y revisa el stock real.',
      '6. Si hay stock, descuenta unidades, crea el pedido y vacia el carrito.',
      '7. Finalmente envia el email de confirmacion del pedido.',
      '',
      'Idea clave: la compra no queda cerrada al anadir al carrito.',
      'La compra queda cerrada cuando Stripe confirma el pago y el backend crea el pedido.'
    ]
  },
  {
    title: 'Carrito y stock',
    subtitle: 'Que ocurre antes de pagar',
    lines: [
      'Frontend:',
      '- El usuario elige producto, talla y cantidad.',
      '- Angular llama al servicio de carrito.',
      '',
      'Backend: CartService.add(...)',
      '- Busca el producto y comprueba que sea comprable.',
      '- Normaliza la talla: por ejemplo XL, 42, etc.',
      '- Mira el stock de esa talla y limita la cantidad maxima.',
      '- Guarda o actualiza la linea en cart_items.',
      '',
      'Tabla cart_items:',
      '- user_id: propietario del carrito.',
      '- product_id: producto guardado.',
      '- size: talla seleccionada.',
      '- quantity: cantidad elegida.',
      '',
      'Importante: aqui no se descuenta stock real. Dos usuarios pueden tener',
      'la misma ultima unidad en sus carritos. Gana quien complete el pago primero.'
    ]
  },
  {
    title: 'Pago con Stripe',
    subtitle: 'Sesion Checkout y control anti-duplicados',
    lines: [
      'Cuando el usuario pulsa "Proceder con el pago":',
      '',
      '1. PaymentService.createCheckoutSession(...) obtiene el usuario actual.',
      '2. Lee los productos de cart_items.',
      '3. Crea line_items para Stripe con nombre, precio y cantidad.',
      '4. Crea una sesion Stripe Checkout y devuelve la URL al frontend.',
      '5. Guarda la sesion en stripe_checkout_sessions como PENDING.',
      '',
      'Estados de stripe_checkout_sessions:',
      '- PENDING: sesion creada, todavia sin procesar.',
      '- PROCESSING: el backend esta creando el pedido.',
      '- COMPLETED: pedido creado correctamente.',
      '- FAILED: fallo durante el procesamiento.',
      '',
      'Esta tabla es importante porque Stripe puede avisar por webhook y tambien',
      'puede volver el usuario desde la pagina de exito. Si llegan dos avisos,',
      'COMPLETED evita que se cree el mismo pedido dos veces.'
    ]
  },
  {
    title: 'Pedido real',
    subtitle: 'Confirmacion, descuento de stock y limpieza del carrito',
    lines: [
      'Stripe confirma el pago por webhook o por la vuelta del usuario a la app.',
      'PaymentService.fulfillPaidCheckout(...) comprueba que paymentStatus sea paid.',
      '',
      'Despues llama a CartService.checkoutPaidCartForUser(userId).',
      'Ese metodo hace el checkout real:',
      '',
      '1. Lee el carrito actual del usuario.',
      '2. Por cada item vuelve a cargar el producto desde base de datos.',
      '3. Calcula el stock real de la talla.',
      '4. Si ya no hay stock suficiente, lanza error y no crea pedido.',
      '5. Si hay stock, descuenta unidades en products.size_stock_json y products.stock.',
      '6. Crea la cabecera en orders.',
      '7. Crea las lineas en order_items.',
      '8. Vacia cart_items del usuario.',
      '',
      'Por eso el stock se decide al pagar, no al meter el producto al carrito.'
    ]
  },
  {
    title: 'Emails y puntos clave',
    subtitle: 'Confirmacion, marketing y mejoras posibles',
    lines: [
      'Email de pedido:',
      '- Tras crear el pedido se llama a MarketingEmailService.sendOrderConfirmationEmail(order).',
      '- El correo se genera en HTML y se envia con JavaMailSender.',
      '- Incluye resumen de productos, cantidades, tallas y total pagado.',
      '',
      'Emails de marketing:',
      '- Bienvenida al registrarse.',
      '- Producto anunciado como proximamente.',
      '- Producto lanzado desde proximamente.',
      '- Reposicion de stock.',
      '- Se envian en segundo plano con @Async para no bloquear al usuario.',
      '',
      'Punto delicado:',
      '- Si dos pagos de la ultima unidad llegan exactamente a la vez, lo ideal',
      '  seria bloquear la fila del producto o hacer un update atomico de stock.',
      '- Para una tienda pequena el flujo actual es entendible, pero en produccion',
      '  conviene reforzarlo con una operacion atomica o SELECT ... FOR UPDATE.'
    ]
  }
];

function escapePdf(value) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[^\x20-\x7E]/g, char => {
      const replacements = {
        'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
        'Á': 'A', 'É': 'E', 'Í': 'I', 'Ó': 'O', 'Ú': 'U',
        'ñ': 'n', 'Ñ': 'N', '¿': '', '¡': ''
      };
      return replacements[char] ?? '';
    });
}

function textLine(x, y, size, text, font = 'F1') {
  return `BT /${font} ${size} Tf ${x} ${y} Td (${escapePdf(text)}) Tj ET\n`;
}

const objects = [];
const add = content => {
  objects.push(content);
  return objects.length;
};

const catalogId = add('');
const pagesId = add('');
const fontRegularId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
const fontBoldId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
const pageIds = [];

for (const page of pages) {
  let stream = '';
  stream += '0.07 0.07 0.08 rg 0 0 612 792 re f\n';
  stream += '0.61 0.45 0.19 rg 0 744 612 48 re f\n';
  stream += textLine(54, 705, 15, 'CEOS BRAND', 'F2');
  stream += textLine(54, 650, 30, page.title, 'F2');
  stream += textLine(54, 615, 18, page.subtitle, 'F2');
  stream += '0.95 0.93 0.90 rg\n';

  let y = 562;
  for (const line of page.lines) {
    if (!line) {
      y -= 14;
      continue;
    }
    const font = line.endsWith(':') ? 'F2' : 'F1';
    stream += textLine(54, y, 11.4, line, font);
    y -= 20;
  }

  stream += '0.61 0.45 0.19 rg 54 72 504 1 re f\n';
  stream += textLine(54, 48, 10, 'Flujo de carrito, pagos, stock y emails - CEOS Brand', 'F1');

  const contentId = add(`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}endstream`);
  const pageId = add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`);
  pageIds.push(pageId);
}

objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

let pdf = '%PDF-1.4\n';
const offsets = [0];
for (let i = 0; i < objects.length; i++) {
  offsets.push(Buffer.byteLength(pdf, 'latin1'));
  pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
}

const xrefOffset = Buffer.byteLength(pdf, 'latin1');
pdf += `xref\n0 ${objects.length + 1}\n`;
pdf += '0000000000 65535 f \n';
for (let i = 1; i <= objects.length; i++) {
  pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

fs.writeFileSync(outputPath, Buffer.from(pdf, 'latin1'));
console.log(outputPath);
