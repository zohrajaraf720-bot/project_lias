package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutDemande;
import ma.univh2c.fsbm.lias.enums.StatutMembre;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeChangementEquipeDTO {
    private Long id;

    // Demandeur
    private Long demandeurId;
    private String demandeurNom;
    private String demandeurPrenom;
    private String demandeurEmail;
    private StatutMembre demandeurStatut;
    private String demandeurPhoto;

    // Ancienne équipe (null si sans équipe)
    private Long ancienneEquipeId;
    private String ancienneEquipeNom;
    private String ancienneEquipeAcronyme;

    // Nouvelle équipe (null si détachement)
    private Long nouvelleEquipeId;
    private String nouvelleEquipeNom;
    private String nouvelleEquipeAcronyme;

    // Type calculé : RATTACHEMENT, TRANSFERT, DETACHEMENT
    private String typeChangement;

    private String motif;
    private LocalDateTime dateDemande;
    private StatutDemande statut;
    private LocalDateTime dateDecision;
    private String motifRefus;
    private String decideurNom;
}
