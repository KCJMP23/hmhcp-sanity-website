import FooterClientWrapper from './footer-client-wrapper'
import FooterServer from './footer-server'

// This is a Server Component that wraps the footer with conditional rendering
export default function FooterWrapper() {
  return (
    <FooterClientWrapper>
      <FooterServer />
    </FooterClientWrapper>
  )
}