package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.StatutEvenement;
import ma.univh2c.fsbm.lias.enums.TypeEvenement;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvenementPublicDTO {
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
}
