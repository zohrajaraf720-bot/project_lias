package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutEvenement;
import ma.univh2c.fsbm.lias.enums.StatutValidationEvenement;
import ma.univh2c.fsbm.lias.enums.TypeEvenement;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvenementDTO {
    private Long id;
    private String titre;
    private String description;
    private TypeEvenement type;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private String edition;
    private String lieu;
    private String lienWebinaire;
    private String programmeDetaille;
    private StatutEvenement statut;
    private StatutValidationEvenement statutValidation;
    private LocalDateTime dateValidation;
    private String commentaireValidation;
    private String valideurNom;
    private LocalDateTime createdAt;
    private List<MembreResumeDTO> organisateurs;
    private Long conventionId;
    private String conventionTitre;
    private Integer nombreParticipants;
    private Long canalId;

    public TypeEvenement getTypeEvenement() {
        return type;
    }

    public MembreResumeDTO getOrganisateur() {
        return (organisateurs != null && !organisateurs.isEmpty()) ? organisateurs.get(0) : null;
    }
}
