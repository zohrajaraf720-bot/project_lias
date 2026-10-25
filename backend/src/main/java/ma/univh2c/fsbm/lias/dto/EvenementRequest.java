package ma.univh2c.fsbm.lias.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import ma.univh2c.fsbm.lias.enums.TypeEvenement;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EvenementRequest {
    @NotBlank(message = "Le titre est obligatoire")
    private String titre;

    private String description;

    @NotNull(message = "Le type d'événement est obligatoire")
    @com.fasterxml.jackson.annotation.JsonAlias("typeEvenement")
    private TypeEvenement type;

    @NotNull(message = "La date de début est obligatoire")
    private LocalDateTime dateDebut;

    @NotNull(message = "La date de fin est obligatoire")
    private LocalDateTime dateFin;

    private String edition;
    private String lieu;
    private String lienWebinaire;
    private String programmeDetaille;
    private List<Long> organisateursIds;
    private Long conventionId;
}
