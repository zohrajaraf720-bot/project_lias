package ma.univh2c.fsbm.lias.repository;

import ma.univh2c.fsbm.lias.entity.Membre;
import ma.univh2c.fsbm.lias.enums.EtatCompte;
import ma.univh2c.fsbm.lias.enums.RoleSysteme;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MembreRepository extends JpaRepository<Membre, Long>, JpaSpecificationExecutor<Membre> {
    Optional<Membre> findByEmail(String email);
    Optional<Membre> findByEmailIgnoreCase(String email);
    boolean existsByEmail(String email);
    long countByRoleSystemeAndEtatCompte(RoleSysteme roleSysteme, EtatCompte etatCompte);
    
    @Query("SELECT m FROM Membre m WHERE m.etatCompte = ma.univh2c.fsbm.lias.enums.EtatCompte.ACTIF AND m.id NOT IN (SELECT DISTINCT am.membre.id FROM AttributionMateriel am)")
    List<Membre> findMembresNonEquipes();

    Page<Membre> findByEtatCompte(EtatCompte etatCompte, Pageable pageable);
    List<Membre> findByEquipeActuelleId(Long equipeId);
}
