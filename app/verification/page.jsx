import VerificationView from '../../src/views/VerificationView';

export const metadata = {
  title: 'Field Verification Console | ReliefOS',
  description: 'Human-in-the-loop ground verification for unconfirmed Dark Zones and silent risk anomalies.',
};

export default function VerificationPage() {
  return <VerificationView />;
}
