package ma.univh2c.fsbm.lias.dto;

import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeEvenement;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvenementResumeDTO {
    private Long id;
    private String titre;
    private LocalDateTime dateDebut;
    private LocalDateTime dateFin;
    private TypeEvenement type;
}
