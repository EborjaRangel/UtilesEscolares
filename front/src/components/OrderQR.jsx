import { QRCodeCanvas } from 'qrcode.react';
import { buildPedidoQrUrl } from '../utils/qrPedido';

export default function OrderQR({ pedido, size = 100, showCode = true, showLabel = false }) {
  if (!pedido?.id) return null;

  const codigo = pedido.codigo_qr || `UE-PEDIDO-${pedido.id}`;
  const qrValue = buildPedidoQrUrl(codigo);

  return (
    <div className="flex shrink-0 flex-col items-center">
      {showLabel && (
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-escolar-navy">
          Código QR
        </p>
      )}
      <div
        className="rounded-xl border-2 border-escolar-navy/20 bg-white p-2 shadow-md"
        style={{ width: size + 16, height: size + 16 }}
      >
        <QRCodeCanvas
          value={qrValue}
          size={size}
          level="M"
          marginSize={2}
          bgColor="#FFFFFF"
          fgColor="#1E3A5F"
          style={{ display: 'block', width: size, height: size }}
        />
      </div>
      {showCode && (
        <p className="mt-2 text-center text-xs font-bold text-escolar-navy">
          {codigo}
        </p>
      )}
    </div>
  );
}
