package ma.univh2c.fsbm.lias.service;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:no-reply@lias.fsbm.ma}")
    private String fromEmail;

    @Async
    public void envoyerEmailAcces(String destinataire, String nom, String motDePasseTemporaire) {
        String sujet = "Bienvenue au Laboratoire LIAS - Vos identifiants d'accès";

        String contenu = """
            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
              Bienvenue au sein du Laboratoire LIAS, %s !
            </h2>
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
              Nous avons le plaisir de vous informer que votre candidature d'adhésion au <strong>Laboratoire d'Intelligence Artificielle et Systèmes (LIAS)</strong> a été officiellement <span style="color: #16a34a; font-weight: 700;">validée et acceptée</span> par la Direction.
            </p>
            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
              Votre compte membre a été créé sur notre portail intranet. Vous trouverez ci-dessous vos identifiants d'accès provisoires :
            </p>

            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%%" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin: 0 0 24px 0; padding: 20px;">
              <tr>
                <td style="padding-bottom: 12px; font-size: 13px; font-weight: 600; color: #64748b; width: 140px;">Identifiant :</td>
                <td style="padding-bottom: 12px; font-size: 14px; font-weight: 700; color: #0f172a; word-break: break-all;">%s</td>
              </tr>
              <tr>
                <td style="font-size: 13px; font-weight: 600; color: #64748b;">Mot de passe temporaire :</td>
                <td>
                  <span style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 15px; font-weight: 700; padding: 6px 14px; border-radius: 8px; border: 1px solid #bfdbfe; letter-spacing: 0.5px;">
                    %s
                  </span>
                </td>
              </tr>
            </table>

            <div style="background-color: #fefce8; border-left: 4px solid #eab308; border-radius: 6px; padding: 14px 16px; margin: 0 0 28px 0;">
              <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #854d0e;">
                <strong>Consigne de sécurité :</strong> Ce mot de passe est strictement confidentiel et temporaire. Lors de votre toute première connexion, il vous sera automatiquement demandé de le modifier.
              </p>
            </div>

            <div style="text-align: center; margin: 0 0 28px 0;">
              <a href="http://localhost:5173/login" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                Accéder au Portail LIAS &rarr;
              </a>
            </div>

            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155;">
              Bien cordialement,<br>
              <strong style="color: #0f172a;">La Direction du Laboratoire LIAS</strong>
            </p>
            """.formatted(nom, destinataire, motDePasseTemporaire);

        String html = wrapHtmlTemplate(sujet, contenu);
        envoyerMailHtml(destinataire, sujet, html);
    }

    @Async
    public void envoyerEmailRefus(String destinataire, String nom, String motif) {
        String sujet = "Laboratoire LIAS - Suite donnée à votre candidature d'adhésion";

        String motifHtml = "";
        if (motif != null && !motif.isBlank()) {
            motifHtml = """
                <div style="background-color: #f8fafc; border-left: 4px solid #94a3b8; border-radius: 6px; padding: 14px 16px; margin: 0 0 22px 0;">
                  <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">
                    Motif de la décision :
                  </p>
                  <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #1e293b; font-style: italic;">
                    &laquo; %s &raquo;
                  </p>
                </div>
                """.formatted(motif);
        }

        String contenu = """
            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
              Suite donnée à votre candidature
            </h2>
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
              Bonjour <strong>%s</strong>,
            </p>
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
              Nous vous remercions sincèrement pour l'intérêt que vous portez aux activités de recherche et aux projets menés au sein du <strong>Laboratoire LIAS</strong>.
            </p>
            <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
              Après un examen attentif de votre dossier de candidature par la Direction du laboratoire, nous sommes au regret de vous informer que votre demande d'adhésion n'a pas pu être retenue pour cette session.
            </p>

            %s

            <p style="margin: 20px 0 24px 0; font-size: 14px; line-height: 1.6; color: #334155;">
              Nous tenons à vous remercier chaleureusement pour le temps consacré à votre candidature et vous souhaitons plein succès dans la poursuite de votre parcours académique et scientifique.
            </p>

            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155;">
              Bien cordialement,<br>
              <strong style="color: #0f172a;">La Direction du Laboratoire LIAS</strong>
            </p>
            """.formatted(nom, motifHtml);

        String html = wrapHtmlTemplate(sujet, contenu);
        envoyerMailHtml(destinataire, sujet, html);
    }

    @Async
    public void envoyerEmailReinitialisation(String destinataire, String lienReinitialisation) {
        String sujet = "Laboratoire LIAS - Réinitialisation de votre mot de passe";

        String contenu = """
            <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a;">
              Réinitialisation de votre mot de passe
            </h2>
            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
              Bonjour,
            </p>
            <p style="margin: 0 0 22px 0; font-size: 14px; line-height: 1.6; color: #334155;">
              Vous avez demandé la réinitialisation de votre mot de passe d'accès à la plateforme du <strong>Laboratoire LIAS</strong>. Veuillez cliquer sur le bouton sécurisé ci-dessous pour en définir un nouveau :
            </p>

            <div style="text-align: center; margin: 0 0 26px 0;">
              <a href="%s" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 32px; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                Réinitialiser mon mot de passe &rarr;
              </a>
            </div>

            <div style="background-color: #f1f5f9; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px 0;">
              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b;">
                Ce lien est valable pendant une durée maximale de <strong>30 minutes</strong>. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer ce message sans inquiétude, votre mot de passe actuel demeure inchangé.
              </p>
            </div>

            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #334155;">
              Cordialement,<br>
              <strong style="color: #0f172a;">Support Technique LIAS</strong>
            </p>
            """.formatted(lienReinitialisation);

        String html = wrapHtmlTemplate(sujet, contenu);
        envoyerMailHtml(destinataire, sujet, html);
    }

    @Async
    public void envoyerEmailNotification(String destinataire, String destinataireNom, String titre, String message, String lienRedirection) {
        if (destinataire == null || destinataire.isBlank()) return;

        String lienComplet = "http://localhost:5173";
        if (lienRedirection != null && !lienRedirection.isBlank()) {
            lienComplet += (lienRedirection.startsWith("/") ? "" : "/") + lienRedirection;
        }

        String boutonHtml = (lienRedirection != null && !lienRedirection.isBlank()) ? """
            <div style="text-align: center; margin: 26px 0 20px 0;">
              <a href="%s" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);">
                Consulter sur le Portail &rarr;
              </a>
            </div>
            """.formatted(lienComplet) : "";

        String contenu = """
            <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 700; color: #0f172a;">
              %s
            </h2>
            <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #334155;">
              Bonjour <strong>%s</strong>,
            </p>
            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 8px; padding: 16px 18px; margin: 16px 0 20px 0;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e293b;">
                %s
              </p>
            </div>
            %s
            <p style="margin: 20px 0 0 0; font-size: 13px; line-height: 1.6; color: #64748b;">
              Laboratoire d'Intelligence Artificielle et Systèmes (LIAS)<br>
              Faculté des Sciences Ben M'Sik &bull; Université Hassan II de Casablanca
            </p>
            """.formatted(titre, (destinataireNom != null ? destinataireNom : "Cher membre"), message, boutonHtml);

        String html = wrapHtmlTemplate(titre, contenu);
        envoyerMailHtml(destinataire, "LIAS - " + titre, html);
    }

    private void envoyerMailHtml(String to, String subject, String htmlContent) {
        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            String from = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : "no-reply@lias.fsbm.ma";
            helper.setFrom(new InternetAddress(from, "Laboratoire LIAS - FSBM", "UTF-8"));
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            log.info("Email HTML officiel envoyé avec succès à {}", to);
        } catch (Exception e) {
            log.warn("Impossible d'expédier l'email réel à {} (erreur: {}). Détails du message : Destinataire={}, Sujet={}",
                    to, e.getMessage(), to, subject);
        }
    }

    private String wrapHtmlTemplate(String title, String bodyContent) {
        return """
            <!DOCTYPE html>
            <html lang="fr">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>%s</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; -webkit-font-smoothing: antialiased;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%%" style="background-color: #f1f5f9; padding: 40px 15px;">
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0;">
                      <!-- En-tête officiel LIAS -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #1e3a8a 0%%, #2563eb 100%%); padding: 32px 30px; text-align: center;">
                          <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                            Laboratoire LIAS
                          </h1>
                          <p style="margin: 6px 0 0 0; font-size: 13px; color: #bfdbfe; font-weight: 500;">
                            Faculté des Sciences Ben M'Sik &bull; Université Hassan II de Casablanca
                          </p>
                        </td>
                      </tr>
                      <!-- Corps du message -->
                      <tr>
                        <td style="padding: 36px 32px 28px 32px;">
                          %s
                        </td>
                      </tr>
                      <!-- Pied de page officiel -->
                      <tr>
                        <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 30px; text-align: center;">
                          <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                            Direction du Laboratoire LIAS &bull; Faculté des Sciences Ben M'Sik<br>
                            Avenue Cdt Driss El Harti, B.P. 7955, Casablanca, Maroc
                          </p>
                          <p style="margin: 10px 0 0 0; font-size: 11px; color: #94a3b8;">
                            Ceci est un message officiel automatique de la plateforme LIAS, merci de ne pas y répondre directement.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(title, bodyContent);
    }
}
