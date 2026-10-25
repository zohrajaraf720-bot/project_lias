package ma.univh2c.fsbm.lias.exception;

import jakarta.servlet.http.HttpServletRequest;
import ma.univh2c.fsbm.lias.dto.ErreurApiDTO;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErreurApiDTO> handleValidationErrors(MethodArgumentNotValidException ex, HttpServletRequest request) {
        List<ErreurApiDTO.ChampErreur> details = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> new ErreurApiDTO.ChampErreur(err.getField(), err.getDefaultMessage()))
                .collect(Collectors.toList());

        ErreurApiDTO error = ErreurApiDTO.builder()
                .horodatage(LocalDateTime.now())
                .statut(HttpStatus.BAD_REQUEST.value())
                .code("VALIDATION_ECHOUEE")
                .message("Erreur de validation des champs")
                .chemin(request.getRequestURI())
                .details(details)
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(RessourceIntrouvableException.class)
    public ResponseEntity<ErreurApiDTO> handleNotFound(RessourceIntrouvableException ex, HttpServletRequest request) {
        ErreurApiDTO error = ErreurApiDTO.builder()
                .horodatage(LocalDateTime.now())
                .statut(HttpStatus.NOT_FOUND.value())
                .code("RESSOURCE_INTROUVABLE")
                .message(ex.getMessage())
                .chemin(request.getRequestURI())
                .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(ConflitEtatException.class)
    public ResponseEntity<ErreurApiDTO> handleConflict(ConflitEtatException ex, HttpServletRequest request) {
        ErreurApiDTO error = ErreurApiDTO.builder()
                .horodatage(LocalDateTime.now())
                .statut(HttpStatus.CONFLICT.value())
                .code("CONFLIT_ETAT")
                .message(ex.getMessage())
                .chemin(request.getRequestURI())
                .build();

        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(RegleMetierException.class)
    public ResponseEntity<ErreurApiDTO> handleRegleMetier(RegleMetierException ex, HttpServletRequest request) {
        ErreurApiDTO error = ErreurApiDTO.builder()
                .horodatage(LocalDateTime.now())
                .statut(HttpStatus.BAD_REQUEST.value())
                .code("REGLE_METIER_VIOLEE")
                .message(ex.getMessage())
                .chemin(request.getRequestURI())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler({BadCredentialsException.class, UsernameNotFoundException.class})
    public ResponseEntity<ErreurApiDTO> handleAuthenticationError(Exception ex, HttpServletRequest request) {
        ErreurApiDTO error = ErreurApiDTO.builder()
                .horodatage(LocalDateTime.now())
                .statut(HttpStatus.UNAUTHORIZED.value())
                .code("IDENTIFIANTS_INVALIDES")
                .message("Email ou mot de passe incorrect")
                .chemin(request.getRequestURI())
                .build();

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler({AccessDeniedException.class, AccesRefuseException.class})
    public ResponseEntity<ErreurApiDTO> handleAccessDenied(Exception ex, HttpServletRequest request) {
        ErreurApiDTO error = ErreurApiDTO.builder()
                .horodatage(LocalDateTime.now())
                .statut(HttpStatus.FORBIDDEN.value())
                .code("ACCES_REFUSE")
                .message(ex.getMessage() != null && !ex.getMessage().isBlank() ? ex.getMessage() : "Vous n'avez pas les autorisations nécessaires pour accéder à cette ressource")
                .chemin(request.getRequestURI())
                .build();

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErreurApiDTO> handleMaxSize(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        ErreurApiDTO error = ErreurApiDTO.builder()
                .horodatage(LocalDateTime.now())
                .statut(HttpStatus.BAD_REQUEST.value())
                .code("TAILLE_FICHIER_DEPASSEE")
                .message("La taille du fichier envoyé dépasse la limite autorisée")
                .chemin(request.getRequestURI())
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErreurApiDTO> handleGeneric(Exception ex, HttpServletRequest request) {
        ErreurApiDTO error = ErreurApiDTO.builder()
                .horodatage(LocalDateTime.now())
                .statut(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .code("ERREUR_INTERNE")
                .message(ex.getMessage() != null ? ex.getMessage() : "Une erreur inattendue s'est produite")
                .chemin(request.getRequestURI())
                .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
