package ma.univh2c.fsbm.lias.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutDemande;
import ma.univh2c.fsbm.lias.enums.StatutMembre;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeAdhesionDTO {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private StatutMembre statutSouhaite;
    private String etablissementOrigine;
    private String laboratoireOrigine;
    private String cvUrl;
    private String lettreMotivationUrl;
    private String motivation;
    private LocalDateTime dateSoumission;
    private StatutDemande statut;
    private LocalDateTime dateDecision;
    private String motifRefus;
    private Long equipeId;
    private String equipeNom;
    private String decideurNom;
    private Long membreCreeId;

    @JsonProperty("statutDemande")
    public StatutDemande getStatutDemande() {
        return statut;
    }

    @JsonProperty("typeSouhaite")
    public StatutMembre getTypeSouhaite() {
        return statutSouhaite;
    }

    @JsonProperty("commentaireDirection")
    public String getCommentaireDirection() {
        return motifRefus;
    }

    @JsonProperty("cheminLettreMotivation")
    public String getCheminLettreMotivation() {
        return lettreMotivationUrl;
    }
}
