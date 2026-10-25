package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutDemande;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeModificationEquipeDTO {
    private Long id;
    private Long equipeId;
    private String equipeNom;
    private String equipeAcronyme;

    private Long demandeurId;
    private String demandeurNom;
    private String demandeurEmail;

    // Nouvelles valeurs proposées
    private String nouveauNom;
    private String nouvelleDescription;
    private List<String> nouvellesThematiques;

    // Anciennes valeurs au moment de la demande
    private String ancienNom;
    private String ancienneDescription;
    private List<String> anciennesThematiques;

    private LocalDateTime dateDemande;
    private StatutDemande statut;
    private LocalDateTime dateDecision;
    private String motifRefus;
    private String decideurNom;
}
