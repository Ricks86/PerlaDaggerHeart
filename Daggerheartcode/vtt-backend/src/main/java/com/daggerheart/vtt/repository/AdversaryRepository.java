package com.daggerheart.vtt.repository;

import com.daggerheart.vtt.model.Adversary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AdversaryRepository extends JpaRepository<Adversary, Long> {}
